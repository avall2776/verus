import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class QuickRepliesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    let replies = await this.prisma.quickReply.findMany({
      where: { tenantId },
      orderBy: { shortcut: 'asc' }
    });

    if (replies.length === 0) {
      const defaults = [
        { shortcut: '/ola', content: 'Olá! Como posso ajudar você hoje?' },
        { shortcut: '/catalogo', content: 'Confira nosso catálogo de produtos e serviços em nosso link oficial: https://catalogo.com' },
        { shortcut: '/pix', content: 'Nossa chave PIX para pagamentos é: cnpj 00.000.000/0001-00' },
        { shortcut: '/horario', content: 'Nosso horário de atendimento é de segunda a sexta, das 08h às 18h.' }
      ];

      for (const d of defaults) {
        try {
          await this.prisma.quickReply.create({
            data: {
              tenantId,
              shortcut: d.shortcut,
              content: d.content
            }
          });
        } catch {
          // ignore duplicate shortcut if created concurrently
        }
      }

      replies = await this.prisma.quickReply.findMany({
        where: { tenantId },
        orderBy: { shortcut: 'asc' }
      });
    }

    return replies;
  }

  async create(tenantId: string, shortcut: string, content: string) {
    // Garante que o atalho começa com "/"
    const formattedShortcut = shortcut.startsWith('/') ? shortcut : `/${shortcut}`;
    
    return this.prisma.quickReply.create({
      data: {
        tenantId,
        shortcut: formattedShortcut,
        content
      }
    });
  }

  async update(tenantId: string, id: string, data: { shortcut?: string; content?: string }) {
    if (data.shortcut && !data.shortcut.startsWith('/')) {
      data.shortcut = `/${data.shortcut}`;
    }

    return this.prisma.quickReply.update({
      where: { id, tenantId },
      data
    });
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.quickReply.delete({
      where: { id, tenantId }
    });
  }
}
