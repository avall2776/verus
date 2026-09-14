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
            email: true,
            source: true,
            tags: true,
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async findOneDeal(tenantId: string, id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            source: true,
            tags: true,
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    if (!deal || deal.tenantId !== tenantId) {
      throw new NotFoundException('Oportunidade não encontrada');
    }

    return deal;
  }

  async findTenantUsers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: { id: true, name: true, email: true, role: true }
    });
  }

  async createDeal(tenantId: string, data: any) {
    let contactId = data.contactId;

    if (!contactId && data.contact) {
      const phone = data.contact.phone || `manual-${Date.now()}`;
      let contact = await this.prisma.contact.findFirst({
        where: { tenantId, phone }
      });
      if (!contact) {
        contact = await this.prisma.contact.create({
          data: {
            tenantId,
            name: data.contact.name || data.title || "Novo Lead",
            phone: data.contact.phone || null,
            email: data.contact.email || null,
            source: data.contact.source || "CRM Manual",
            tags: data.contact.tags || ["Lead"],
          }
        });
      }
      contactId = contact.id;
    }

    if (!contactId) {
      let defaultContact = await this.prisma.contact.findFirst({ where: { tenantId } });
      if (!defaultContact) {
        defaultContact = await this.prisma.contact.create({
          data: {
            tenantId,
            name: data.title || "Lead Comercial",
            source: "CRM",
            tags: ["Lead"]
          }
        });
      }
      contactId = defaultContact.id;
    }

    return this.prisma.deal.create({
      data: {
        tenantId,
        contactId,
        title: data.title || "Nova Oportunidade",
        value: data.value ? Number(data.value) : 0,
        status: data.status || "new",
        notes: data.notes || null,
        metadata: data.metadata || {},
        assignedTo: data.assignedTo || null,
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            source: true,
            tags: true,
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
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
