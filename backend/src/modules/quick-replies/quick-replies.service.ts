import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { extractGoogleDriveId, detectMediaType } from '../../shared/helpers/google-drive.helper';

export interface CreateQuickReplyDto {
  shortcut: string;
  content?: string;
  title?: string;
  type?: 'text' | 'document' | 'image' | 'video';
  mediaUrl?: string;
  mediaDriveId?: string;
  fileName?: string;
}

export interface UpdateQuickReplyDto {
  shortcut?: string;
  content?: string;
  title?: string;
  type?: 'text' | 'document' | 'image' | 'video';
  mediaUrl?: string;
  mediaDriveId?: string;
  fileName?: string;
}

@Injectable()
export class QuickRepliesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    let replies = await this.prisma.quickReply.findMany({
      where: { tenantId },
      orderBy: { shortcut: 'asc' },
    });

    if (replies.length === 0) {
      const defaults = [
        {
          shortcut: '/ola',
          title: 'Saudação Padrão',
          content: 'Olá! Como posso ajudar você hoje?',
          type: 'text',
        },
        {
          shortcut: '/catalogo',
          title: 'Catálogo de Produtos e Serviços',
          content: 'Confira nosso catálogo oficial com as soluções técnicas e comerciais completas!',
          type: 'document',
          mediaUrl: 'https://drive.google.com/file/d/1demo-catalogo-verto/view',
          fileName: 'Catalogo_Oficial_Verto.pdf',
        },
        {
          shortcut: '/pix',
          title: 'Dados para Pagamento PIX',
          content: 'Nossa chave PIX para pagamentos é: cnpj 00.000.000/0001-00',
          type: 'text',
        },
        {
          shortcut: '/horario',
          title: 'Horário de Atendimento',
          content: 'Nosso horário de atendimento é de segunda a sexta, das 08h às 18h.',
          type: 'text',
        },
      ];

      for (const d of defaults) {
        try {
          await this.prisma.quickReply.create({
            data: {
              tenantId,
              shortcut: d.shortcut,
              title: d.title,
              content: d.content,
              type: d.type,
              mediaUrl: d.mediaUrl || null,
              mediaDriveId: d.mediaUrl ? extractGoogleDriveId(d.mediaUrl) : null,
              fileName: d.fileName || null,
            },
          });
        } catch {
          // ignore duplicate shortcut if created concurrently
        }
      }

      replies = await this.prisma.quickReply.findMany({
        where: { tenantId },
        orderBy: { shortcut: 'asc' },
      });
    }

    return replies;
  }

  async create(tenantId: string, data: CreateQuickReplyDto) {
    const rawShortcut = data.shortcut || '';
    const formattedShortcut = rawShortcut.startsWith('/') ? rawShortcut.trim() : `/${rawShortcut.trim()}`;

    const mediaUrl = data.mediaUrl ? data.mediaUrl.trim() : null;
    const mediaDriveId = mediaUrl ? extractGoogleDriveId(mediaUrl) : (data.mediaDriveId || null);

    let resolvedType: string = data.type || 'text';
    if (mediaUrl && (!data.type || data.type === 'text')) {
      resolvedType = detectMediaType(data.fileName || mediaUrl);
    }

    // Se for arquivo e não tiver fileName definido
    let fileName = data.fileName ? data.fileName.trim() : null;
    if (mediaUrl && !fileName) {
      const ext = resolvedType === 'document' ? '.pdf' : resolvedType === 'video' ? '.mp4' : '.jpg';
      const cleanTitle = (data.title || 'material').replace(/[^a-zA-Z0-9_-]/g, '_');
      fileName = `${cleanTitle}${ext}`;
    }

    return this.prisma.quickReply.create({
      data: {
        tenantId,
        shortcut: formattedShortcut,
        title: data.title ? data.title.trim() : null,
        content: data.content ? data.content.trim() : (data.title || ''),
        type: resolvedType,
        mediaUrl,
        mediaDriveId,
        fileName,
      },
    });
  }

  async update(tenantId: string, id: string, data: UpdateQuickReplyDto) {
    const updatePayload: any = {};

    if (data.shortcut) {
      updatePayload.shortcut = data.shortcut.startsWith('/') ? data.shortcut.trim() : `/${data.shortcut.trim()}`;
    }

    if (data.title !== undefined) {
      updatePayload.title = data.title ? data.title.trim() : null;
    }

    if (data.content !== undefined) {
      updatePayload.content = data.content ? data.content.trim() : '';
    }

    if (data.type !== undefined) {
      updatePayload.type = data.type;
    }

    if (data.mediaUrl !== undefined) {
      const mediaUrl = data.mediaUrl ? data.mediaUrl.trim() : null;
      updatePayload.mediaUrl = mediaUrl;
      updatePayload.mediaDriveId = mediaUrl ? extractGoogleDriveId(mediaUrl) : null;
    }

    if (data.fileName !== undefined) {
      updatePayload.fileName = data.fileName ? data.fileName.trim() : null;
    }

    return this.prisma.quickReply.update({
      where: { id, tenantId },
      data: updatePayload,
    });
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.quickReply.delete({
      where: { id, tenantId },
    });
  }
}
