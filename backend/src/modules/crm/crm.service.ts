import { Injectable, NotFoundException, BadRequestException, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AutomationsService } from '../automations/automations.service';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);
  private readonly dealsCache = new Map<string, { data: any; expiresAt: number }>();

  clearDealsCache(tenantId?: string) {
    if (!tenantId) {
      this.dealsCache.clear();
      return;
    }
    for (const k of this.dealsCache.keys()) {
      if (k.startsWith(`${tenantId}:`)) {
        this.dealsCache.delete(k);
      }
    }
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly automationsService: AutomationsService,
    @Optional() private readonly chatGateway?: ChatGateway
  ) {}

  async getStages(tenantId: string) {
    const tenant = await (this.prisma as any).tenant.findUnique({
      where: { id: tenantId },
      select: { crmStages: true, crmFunnelName: true },
    });
    return {
      stages: tenant?.crmStages || null,
      funnelName: tenant?.crmFunnelName || null,
    };
  }

  async updateStages(tenantId: string, stages: any[], funnelName?: string) {
    const dataToUpdate: any = { crmStages: stages };
    if (funnelName !== undefined && funnelName !== null) {
      dataToUpdate.crmFunnelName = funnelName;
    }
    const updated = await (this.prisma as any).tenant.update({
      where: { id: tenantId },
      data: dataToUpdate,
      select: { crmStages: true, crmFunnelName: true },
    });

    try {
      if (this.chatGateway?.server) {
        this.chatGateway.server.emit('crmStagesUpdated', {
          tenantId,
          stages: updated.crmStages,
          funnelName: updated.crmFunnelName,
        });
      }
    } catch (err: any) {
      this.logger.warn(`Erro ao emitir crmStagesUpdated via socket: ${err?.message}`);
    }

    return {
      stages: updated.crmStages,
      funnelName: updated.crmFunnelName,
    };
  }

  async findAllDeals(tenantId: string, filters?: { startDate?: string; endDate?: string; dateType?: 'created' | 'closed'; status?: string }) {
    const cacheKey = `${tenantId}:${filters?.status || 'all'}:${filters?.startDate || ''}:${filters?.endDate || ''}`;
    const cached = this.dealsCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const where: any = { tenantId };

    if (filters?.status && filters.status !== 'all') {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      const field = filters.dateType === 'closed' ? 'updatedAt' : 'createdAt';
      where[field] = {};
      if (filters.startDate) {
        where[field].gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where[field].lte = new Date(filters.endDate);
      }
    }

    const deals = await this.prisma.deal.findMany({
      where,
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

    deals.sort((a: any, b: any) => {
      const pA = a.metadata?.position !== undefined && a.metadata?.position !== null ? Number(a.metadata.position) : -1;
      const pB = b.metadata?.position !== undefined && b.metadata?.position !== null ? Number(b.metadata.position) : -1;
      if (pA !== pB) return pA - pB;
      const tA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const tB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      if (tA !== tB) return tB - tA;
      return String(a.id).localeCompare(String(b.id));
    });

    this.dealsCache.set(cacheKey, { data: deals, expiresAt: Date.now() + 15000 });
    return deals;
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
    const users = await this.prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        canAccessMarketing: true,
        permissions: true,
        departments: {
          select: {
            department: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    // Excluir usuários que pertencem exclusivamente à equipe de Marketing
    return users.filter(u => {
      const deptNames = (u.departments || []).map(d => (d.department?.name || '').toLowerCase());
      const isMarketingDept = deptNames.some(n => n.includes('marketing'));
      const isCommercialDept = deptNames.some(n => n.includes('comercial') || n.includes('venda') || n.includes('crm') || n.includes('atendimento'));
      
      // Se está em Marketing e NÃO está em Comercial/Vendas/Atendimento
      if (isMarketingDept && !isCommercialDept) return false;
      
      // Se email é de marketing e não tem departamento comercial
      if (u.email?.toLowerCase().includes('marketing@') && !isCommercialDept) return false;

      return true;
    });
  }

  async createDeal(tenantId: string, data: any, currentUserId?: string) {
    this.clearDealsCache(tenantId);
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

    // Impedir criação de dois deals abertos simultâneos para o mesmo contactId no mesmo funil
    const closedStatuses = new Set(['won', 'lost', 'disqualified']);
    const incomingStatus = String(data.status || 'new').trim().toLowerCase();
    if (!closedStatuses.has(incomingStatus) && !data.allowDuplicate) {
      const incomingFunnel = String(
        data.metadata?.funnelId || data.metadata?.lero_funnel_name || 'default'
      ).trim().toLowerCase();

      const openDeals = await this.prisma.deal.findMany({
        where: {
          tenantId,
          contactId,
          status: { notIn: ['won', 'lost', 'disqualified'] },
        },
        select: { id: true, title: true, status: true, metadata: true },
      });

      const conflict = openDeals.find((d: any) => {
        const meta = (d.metadata as Record<string, any>) || {};
        const dealFunnel = String(meta.funnelId || meta.lero_funnel_name || 'default').trim().toLowerCase();
        return dealFunnel === incomingFunnel || dealFunnel === 'default' || incomingFunnel === 'default';
      });

      if (conflict) {
        throw new BadRequestException(
          `Já existe uma oportunidade em aberto para este contato neste funil ("${conflict.title}").`
        );
      }
    }

    let resolvedAssignedTo = data.assignedTo || null;
    if (!resolvedAssignedTo) {
      const latestConv = await this.prisma.conversation.findFirst({
        where: { tenantId, contactId, assignedTo: { not: null } },
        orderBy: { updatedAt: 'desc' },
        select: { assignedTo: true },
      });
      resolvedAssignedTo = latestConv?.assignedTo || currentUserId || null;
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
        assignedTo: resolvedAssignedTo,
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
    this.clearDealsCache(tenantId);
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      select: { id: true, tenantId: true, contactId: true, status: true, metadata: true }
    });
    if (!deal || deal.tenantId !== tenantId) throw new NotFoundException('Deal não encontrado');

    // Extrair e sanitizar campos que não existem como coluna direta no modelo Deal do Prisma
    const { lossReason, lossComment, contact, assignee, proposals, emails, automationLogs, ...rest } = data;

    // Mesclar lossReason e lossComment no metadata de forma transparente e segura
    const existingMeta = (deal.metadata as Record<string, any>) || {};
    const mergedMetadata: Record<string, any> = {
      ...existingMeta,
      ...(rest.metadata || {}),
      ...(lossReason ? { lossReason } : {}),
      ...(lossComment ? { lossComment } : {}),
    };
    if (rest.status === 'won' && deal.status !== 'won' && !mergedMetadata.closedAt) {
      mergedMetadata.closedAt = new Date().toISOString();
    }

    // Montar payload estritamente compatível com o Prisma Deal
    const safeData: any = {};
    if (rest.title !== undefined) safeData.title = rest.title;
    if (rest.value !== undefined) safeData.value = Number(rest.value);
    if (rest.status !== undefined) safeData.status = rest.status;
    if (rest.notes !== undefined) safeData.notes = rest.notes;
    if (rest.assignedTo !== undefined) safeData.assignedTo = rest.assignedTo;
    if (rest.contactId !== undefined) safeData.contactId = rest.contactId;
    safeData.metadata = mergedMetadata;

    const updated = await this.prisma.deal.update({
      where: { id },
      data: safeData
    });

    if (safeData.status && safeData.status !== deal.status) {
      // Executa automações em background assíncrono para retorno instantâneo (<50ms) ao usuário
      this.automationsService.evaluateEvent(tenantId, 'STAGE_CHANGED', {
        contactId: deal.contactId,
        stage: safeData.status,
        dealId: deal.id,
      }).catch(err => {
        this.logger.error(`Erro ao disparar automação STAGE_CHANGED para deal ${id}: ${err?.message || err}`);
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
    dto: { contactId: string; stageId: string; title?: string; value?: number },
    currentUserId?: string
  ) {
    this.clearDealsCache(tenantId);
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
      where: { tenantId, contactId, status: { notIn: ['won', 'lost', 'disqualified'] } },
      orderBy: { updatedAt: 'desc' },
    });
    if (!deal) {
      deal = await this.prisma.deal.findFirst({
        where: { tenantId, contactId },
        orderBy: { updatedAt: 'desc' },
      });
    }

    const previousStage = deal?.status;

    if (deal) {
      deal = await this.prisma.deal.update({
        where: { id: deal.id },
        data: {
          status: stageId,
          ...(title ? { title } : {}),
          ...(value !== undefined ? { value: Number(value) } : {}),
          ...(!deal.assignedTo && currentUserId ? { assignedTo: currentUserId } : {}),
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
      const latestConv = await this.prisma.conversation.findFirst({
        where: { tenantId, contactId, assignedTo: { not: null } },
        orderBy: { updatedAt: 'desc' },
        select: { assignedTo: true },
      });
      deal = await this.prisma.deal.create({
        data: {
          tenantId,
          contactId,
          title: title || contact.name || 'Nova Oportunidade',
          status: stageId,
          value: value !== undefined ? Number(value) : 0,
          assignedTo: latestConv?.assignedTo || currentUserId || null,
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
      // Disparo em background não-bloqueante
      this.automationsService.evaluateEvent(tenantId, 'STAGE_CHANGED', {
        contactId,
        stage: stageId,
        dealId: deal.id,
      }).catch(err => {
        this.logger.error(`Erro ao disparar automação STAGE_CHANGED para contato ${contactId}: ${err?.message || err}`);
      });
    }

    return deal;
  }
}

