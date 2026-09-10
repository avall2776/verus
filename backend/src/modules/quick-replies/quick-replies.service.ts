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
}
