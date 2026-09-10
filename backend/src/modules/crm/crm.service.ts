import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllDeals(tenantId: string) {
    return this.prisma.deal.findMany({
      where: { tenantId },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            tags: true,
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async updateDeal(tenantId: string, dealId: string, data: { status?: string; value?: number; assignedTo?: string }) {
    return this.prisma.deal.updateMany({
      where: { id: dealId, tenantId },
      data
    });
  }
}
