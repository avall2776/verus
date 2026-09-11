import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AutomationsService } from '../automations/automations.service';

@Injectable()
export class CrmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly automationsService: AutomationsService
  ) {}

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

  async findTenantUsers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: { id: true, name: true, email: true, role: true }
    });
  }

  async createDeal(tenantId: string, data: any) {
    return this.prisma.deal.create({
      data: {
        tenantId,
        ...data
      }
    });
  }

  async updateDeal(tenantId: string, id: string, data: any) {
    const deal = await this.prisma.deal.findUnique({ where: { id } });
    if (!deal || deal.tenantId !== tenantId) throw new NotFoundException('Deal não encontrado');

    const updated = await this.prisma.deal.update({
      where: { id },
      data
    });

    if (data.status && data.status !== deal.status) {
       await this.automationsService.evaluateEvent(tenantId, 'STAGE_CHANGED', {
         contactId: deal.contactId,
         stage: data.status
       });
    }

    return updated;
  }

}
