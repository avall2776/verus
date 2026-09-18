import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  /**
   * Obtém a oportunidade comercial (Deal) mais recente vinculada a um contato específico
   */
  async getContactDeal(tenantId: string, contactId: string) {
    return this.prisma.deal.findFirst({
      where: { tenantId, contactId },
      orderBy: { updatedAt: 'desc' },
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

  /**
   * Move ou vincula instantaneamente um contato a um estágio do funil de CRM
   */
  async moveContactToStage(
    tenantId: string,
    dto: { contactId: string; stageId: string; title?: string; value?: number }
  ) {
    const { contactId, stageId, title, value } = dto;
    if (!contactId || !stageId) {
      throw new BadRequestException('contactId e stageId são obrigatórios.');
    }

    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, tenantId },
    });
    if (!contact) {
      throw new NotFoundException('Contato não encontrado no tenant.');
    }

    let deal = await this.prisma.deal.findFirst({
      where: { tenantId, contactId },
      orderBy: { updatedAt: 'desc' },
    });

    const previousStage = deal?.status;

    if (deal) {
      deal = await this.prisma.deal.update({
        where: { id: deal.id },
        data: {
          status: stageId,
          ...(title ? { title } : {}),
          ...(value !== undefined ? { value: Number(value) } : {}),
          updatedAt: new Date(),
        },
        include: {
          contact: {
            select: { id: true, name: true, phone: true, email: true, source: true, tags: true },
          },
          assignee: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    } else {
      deal = await this.prisma.deal.create({
        data: {
          tenantId,
          contactId,
          title: title || contact.name || 'Nova Oportunidade',
          status: stageId,
          value: value !== undefined ? Number(value) : 0,
        },
        include: {
          contact: {
            select: { id: true, name: true, phone: true, email: true, source: true, tags: true },
          },
          assignee: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    }

    if (previousStage !== stageId) {
      try {
        await this.automationsService.evaluateEvent(tenantId, 'STAGE_CHANGED', {
          contactId,
          stage: stageId,
          dealId: deal.id,
        });
      } catch (err: any) {
        // Falha em automação não deve abortar movimentação manual de estágio
      }
    }

    return deal;
  }
}

