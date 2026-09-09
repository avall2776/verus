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
            name: true,
            phone: true,
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async updateDealStatus(tenantId: string, dealId: string, status: string) {
    return this.prisma.deal.updateMany({
      where: { id: dealId, tenantId },
      data: { status }
    });
  }
}
