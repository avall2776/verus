import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class QuickRepliesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.quickReply.findMany({
      where: { tenantId },
      orderBy: { shortcut: 'asc' }
    });
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
