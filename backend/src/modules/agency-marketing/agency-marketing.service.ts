import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateMarketingCardDto } from './dto/create-marketing-card.dto';
import { UpdateMarketingCardDto } from './dto/update-marketing-card.dto';
import { CreateMarketingClientDto } from './dto/create-marketing-client.dto';
import { UpdateMarketingClientDto } from './dto/update-marketing-client.dto';
import { CreateMarketingCampaignDto } from './dto/create-marketing-campaign.dto';
import { UpdateMarketingCampaignDto } from './dto/update-marketing-campaign.dto';
import { TimeClockDto } from './dto/time-clock.dto';
import * as crypto from 'crypto';

@Injectable()
export class AgencyMarketingService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================================
  // 1. KANBAN DE PRODUÇÃO OPERACIONAL (CARDS)
  // =========================================================================

  async getCards(tenantId: string, filters?: { clientId?: string; status?: string; search?: string }) {
    const where: any = { tenantId };

    if (filters?.clientId && filters.clientId !== 'ALL') {
      where.marketingClientId = filters.clientId;
    }

    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { marketingClient: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.marketingCard.findMany({
      where,
      include: {
        marketingClient: {
          select: {
            id: true,
            name: true,
            brandColor: true,
            logoUrl: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            email: true,
          },
        },
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createCard(tenantId: string, dto: CreateMarketingCardDto) {
    const client = await this.prisma.marketingClient.findFirst({
      where: { id: dto.marketingClientId, tenantId },
    });

    if (!client) {
      throw new NotFoundException('Cliente de marketing não encontrado na sua empresa.');
    }

    // Calcular próxima posição na coluna
    const status = dto.status || 'BACKLOG';
    const lastCard = await this.prisma.marketingCard.findFirst({
      where: { tenantId, status },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    const nextPosition = (lastCard?.position ?? -1) + 1;

    return this.prisma.marketingCard.create({
      data: {
        tenantId,
        marketingClientId: dto.marketingClientId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        format: dto.format || 'POST',
        status,
        position: dto.position !== undefined ? dto.position : nextPosition,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        publishDate: dto.publishDate ? new Date(dto.publishDate) : null,
        priority: dto.priority || 'MEDIA',
        assignedUserId: dto.assignedUserId || null,
        value: dto.value !== undefined ? dto.value : 0,
        checklist: dto.checklist || [],
        attachments: dto.attachments || [],
      },
      include: {
        marketingClient: {
          select: {
            id: true,
            name: true,
            brandColor: true,
            logoUrl: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            email: true,
          },
        },
      },
    });
  }

  async updateCard(tenantId: string, cardId: string, dto: UpdateMarketingCardDto) {
    const card = await this.prisma.marketingCard.findFirst({
      where: { id: cardId, tenantId },
    });

    if (!card) {
      throw new NotFoundException('Card de marketing não encontrado.');
    }

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined) data.description = dto.description?.trim() || null;
    if (dto.marketingClientId !== undefined) data.marketingClientId = dto.marketingClientId;
    if (dto.format !== undefined) data.format = dto.format;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.position !== undefined) data.position = dto.position;
    if (dto.dueDate !== undefined) data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dto.publishDate !== undefined) data.publishDate = dto.publishDate ? new Date(dto.publishDate) : null;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.assignedUserId !== undefined) data.assignedUserId = dto.assignedUserId || null;
    if (dto.value !== undefined) data.value = dto.value;
    if (dto.checklist !== undefined) data.checklist = dto.checklist;
    if (dto.attachments !== undefined) data.attachments = dto.attachments;

    return this.prisma.marketingCard.update({
      where: { id: cardId },
      data,
      include: {
        marketingClient: {
          select: {
            id: true,
            name: true,
            brandColor: true,
            logoUrl: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            email: true,
          },
        },
      },
    });
  }

  async reorderCards(tenantId: string, items: Array<{ id: string; status: string; position: number }>) {
    if (!Array.isArray(items) || items.length === 0) {
      return { success: true, updatedCount: 0 };
    }

    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.marketingCard.updateMany({
          where: { id: item.id, tenantId },
          data: {
            status: item.status,
            position: item.position,
          },
        })
      )
    );

    return { success: true, updatedCount: items.length };
  }

  async deleteCard(tenantId: string, cardId: string) {
    const card = await this.prisma.marketingCard.findFirst({
      where: { id: cardId, tenantId },
    });

    if (!card) {
      throw new NotFoundException('Card de marketing não encontrado.');
    }

    await this.prisma.marketingCard.delete({
      where: { id: cardId },
    });

    return { success: true, message: 'Card removido com sucesso.' };
  }

  // =========================================================================
  // 2. GESTÃO DE CLIENTES & ESCOPOS DE MARKETING
  // =========================================================================

  async getClients(tenantId: string) {
    const clients = await this.prisma.marketingClient.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: {
            cards: true,
            campaigns: true,
          },
        },
        cards: {
          select: {
            id: true,
            format: true,
            status: true,
            dueDate: true,
            publishDate: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return clients.map((client) => {
      const deliveredInMonth = client.cards.filter((c) => {
        const isCompleted = c.status === 'AGENDADO_POSTADO';
        if (!isCompleted) return false;
        const refDate = c.publishDate || c.dueDate;
        if (!refDate) return true;
        const d = new Date(refDate);
        return d >= currentMonthStart && d <= currentMonthEnd;
      });

      const postsDelivered = deliveredInMonth.filter((c) => c.format === 'POST' || c.format === 'CARROSSEL').length;
      const reelsDelivered = deliveredInMonth.filter((c) => c.format === 'REELS').length;
      const deliverables: any = client.monthlyDeliverables || { posts: 12, reels: 4, stories: 20 };

      return {
        id: client.id,
        name: client.name,
        brandColor: client.brandColor || '#00D2FF',
        logoUrl: client.logoUrl,
        contactName: client.contactName,
        contactEmail: client.contactEmail,
        contactPhone: client.contactPhone,
        planTier: client.planTier || 'Performance Pro',
        monthlyDeliverables: deliverables,
        adBudget: Number(client.adBudget || 0),
        assignedUserId: client.assignedUserId,
        status: client.status,
        createdAt: client.createdAt,
        metrics: {
          totalCards: client._count.cards,
          totalCampaigns: client._count.campaigns,
          deliveredMonthCount: deliveredInMonth.length,
          postsProgress: {
            delivered: postsDelivered,
            target: Number(deliverables.posts || 12),
          },
          reelsProgress: {
            delivered: reelsDelivered,
            target: Number(deliverables.reels || 4),
          },
        },
      };
    });
  }

  async createClient(tenantId: string, dto: CreateMarketingClientDto) {
    const deliverables: any = { ...(dto.monthlyDeliverables || {}) };
    if (deliverables.posts === undefined) deliverables.posts = 12;
    if (deliverables.reels === undefined) deliverables.reels = 4;
    if (deliverables.stories === undefined) deliverables.stories = 20;
    if (deliverables.campaigns === undefined) deliverables.campaigns = 2;

    if (!Array.isArray(deliverables.history) || deliverables.history.length === 0) {
      deliverables.history = [
        {
          id: crypto.randomUUID(),
          action: `Cadastrado: ${dto.name.trim()}`,
          author: 'Operador',
          date: new Date().toISOString(),
        },
      ];
    }

    return this.prisma.marketingClient.create({
      data: {
        tenantId,
        name: dto.name.trim(),
        brandColor: dto.brandColor || '#00D2FF',
        logoUrl: dto.logoUrl || null,
        contactName: dto.contactName?.trim() || null,
        contactEmail: dto.contactEmail?.trim().toLowerCase() || null,
        contactPhone: dto.contactPhone?.trim() || null,
        planTier: dto.planTier || 'Performance Pro',
        monthlyDeliverables: deliverables,
        adBudget: dto.adBudget !== undefined ? dto.adBudget : 0,
        assignedUserId: dto.assignedUserId || null,
        status: dto.status || 'ACTIVE',
      },
    });
  }

  async updateClient(tenantId: string, clientId: string, dto: UpdateMarketingClientDto) {
    const client = await this.prisma.marketingClient.findFirst({
      where: { id: clientId, tenantId },
    });

    if (!client) {
      throw new NotFoundException('Cliente de marketing não encontrado.');
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.brandColor !== undefined) data.brandColor = dto.brandColor;
    if (dto.logoUrl !== undefined) data.logoUrl = dto.logoUrl;
    if (dto.contactName !== undefined) data.contactName = dto.contactName?.trim() || null;
    if (dto.contactEmail !== undefined) data.contactEmail = dto.contactEmail?.trim().toLowerCase() || null;
    if (dto.contactPhone !== undefined) data.contactPhone = dto.contactPhone?.trim() || null;
    if (dto.planTier !== undefined) data.planTier = dto.planTier;
    if (dto.adBudget !== undefined) data.adBudget = dto.adBudget;
    if (dto.assignedUserId !== undefined) data.assignedUserId = dto.assignedUserId || null;
    if (dto.status !== undefined) data.status = dto.status;

    const existingDel: any = client.monthlyDeliverables || {};
    const updatedDel: any = dto.monthlyDeliverables !== undefined ? { ...existingDel, ...dto.monthlyDeliverables } : { ...existingDel };
    
    // Automatically record update in history
    const existingHistory = Array.isArray(updatedDel.history) ? [...updatedDel.history] : [];
    const clientName = dto.name?.trim() || client.name;
    const newHistoryItem = {
      id: crypto.randomUUID(),
      action: `Atualizado: ${clientName}`,
      author: 'Operador',
      date: new Date().toISOString(),
    };
    
    const lastLog = existingHistory[0];
    const isRecent = lastLog && (Date.now() - new Date(lastLog.date).getTime() < 3000);
    if (!isRecent) {
      existingHistory.unshift(newHistoryItem);
    }
    updatedDel.history = existingHistory;
    data.monthlyDeliverables = updatedDel;

    return this.prisma.marketingClient.update({
      where: { id: clientId },
      data,
    });
  }

  async deleteClient(tenantId: string, clientId: string) {
    const client = await this.prisma.marketingClient.findFirst({
      where: { id: clientId, tenantId },
    });

    if (!client) {
      throw new NotFoundException('Cliente de marketing não encontrado.');
    }

    await this.prisma.marketingClient.delete({
      where: { id: clientId },
    });

    return { success: true, message: 'Cliente removido com sucesso.' };
  }

  async getClientPieces(tenantId: string, clientId: string) {
    const client = await this.prisma.marketingClient.findFirst({
      where: { id: clientId, tenantId },
      include: {
        cards: {
          include: {
            assignedUser: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return client;
  }

  // =========================================================================
  // 3. ABA TRÁFEGO PAGO (CAMPANHAS, BUDGET, CPL, ROAS, LEADS)
  // =========================================================================

  async getCampaigns(tenantId: string, filters?: { clientId?: string; platform?: string; status?: string }) {
    const where: any = { tenantId };

    if (filters?.clientId && filters.clientId !== 'ALL') {
      where.marketingClientId = filters.clientId;
    }
    if (filters?.platform && filters.platform !== 'ALL') {
      where.platform = filters.platform;
    }
    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }

    return this.prisma.marketingCampaign.findMany({
      where,
      include: {
        marketingClient: {
          select: {
            id: true,
            name: true,
            brandColor: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCampaign(tenantId: string, dto: CreateMarketingCampaignDto) {
    const client = await this.prisma.marketingClient.findFirst({
      where: { id: dto.marketingClientId, tenantId },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado.');
    }

    return this.prisma.marketingCampaign.create({
      data: {
        tenantId,
        marketingClientId: dto.marketingClientId,
        name: dto.name.trim(),
        platform: dto.platform || 'META_ADS',
        status: dto.status || 'ACTIVE',
        objective: dto.objective || 'LEADS',
        budgetDaily: dto.budgetDaily ?? 0,
        budgetTotal: dto.budgetTotal ?? 0,
        spentAmount: dto.spentAmount ?? 0,
        leadsGenerated: dto.leadsGenerated ?? 0,
        cpl: dto.cpl ?? 0,
        roas: dto.roas ?? 0,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        targetAudience: dto.targetAudience?.trim() || null,
        campaignUrl: dto.campaignUrl?.trim() || null,
      },
      include: {
        marketingClient: {
          select: {
            id: true,
            name: true,
            brandColor: true,
            logoUrl: true,
          },
        },
      },
    });
  }

  async updateCampaign(tenantId: string, campaignId: string, dto: UpdateMarketingCampaignDto) {
    const campaign = await this.prisma.marketingCampaign.findFirst({
      where: { id: campaignId, tenantId },
    });

    if (!campaign) {
      throw new NotFoundException('Campanha não encontrada.');
    }

    const data: any = {};
    if (dto.marketingClientId !== undefined) data.marketingClientId = dto.marketingClientId;
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.platform !== undefined) data.platform = dto.platform;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.objective !== undefined) data.objective = dto.objective;
    if (dto.budgetDaily !== undefined) data.budgetDaily = dto.budgetDaily;
    if (dto.budgetTotal !== undefined) data.budgetTotal = dto.budgetTotal;
    if (dto.spentAmount !== undefined) data.spentAmount = dto.spentAmount;
    if (dto.leadsGenerated !== undefined) data.leadsGenerated = dto.leadsGenerated;
    if (dto.cpl !== undefined) data.cpl = dto.cpl;
    if (dto.roas !== undefined) data.roas = dto.roas;
    if (dto.startDate !== undefined) data.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined) data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.targetAudience !== undefined) data.targetAudience = dto.targetAudience?.trim() || null;
    if (dto.campaignUrl !== undefined) data.campaignUrl = dto.campaignUrl?.trim() || null;

    return this.prisma.marketingCampaign.update({
      where: { id: campaignId },
      data,
      include: {
        marketingClient: {
          select: {
            id: true,
            name: true,
            brandColor: true,
            logoUrl: true,
          },
        },
      },
    });
  }

  async deleteCampaign(tenantId: string, campaignId: string) {
    const campaign = await this.prisma.marketingCampaign.findFirst({
      where: { id: campaignId, tenantId },
    });

    if (!campaign) {
      throw new NotFoundException('Campanha não encontrada.');
    }

    await this.prisma.marketingCampaign.delete({
      where: { id: campaignId },
    });

    return { success: true, message: 'Campanha removida com sucesso.' };
  }

  async getTrafficSummary(tenantId: string) {
    const campaigns = await this.prisma.marketingCampaign.findMany({
      where: { tenantId },
    });

    let totalBudget = 0;
    let totalSpent = 0;
    let totalLeads = 0;
    let sumRoas = 0;
    let campaignsWithRoas = 0;

    const byPlatform: Record<string, { count: number; spent: number; leads: number }> = {
      META_ADS: { count: 0, spent: 0, leads: 0 },
      GOOGLE_ADS: { count: 0, spent: 0, leads: 0 },
      TIKTOK_ADS: { count: 0, spent: 0, leads: 0 },
      LINKEDIN_ADS: { count: 0, spent: 0, leads: 0 },
    };

    campaigns.forEach((c) => {
      const spent = Number(c.spentAmount || 0);
      const budget = Number(c.budgetTotal || 0);
      const leads = Number(c.leadsGenerated || 0);
      const roas = Number(c.roas || 0);

      totalSpent += spent;
      totalBudget += budget;
      totalLeads += leads;

      if (roas > 0) {
        sumRoas += roas;
        campaignsWithRoas++;
      }

      const plat = c.platform || 'META_ADS';
      if (!byPlatform[plat]) {
        byPlatform[plat] = { count: 0, spent: 0, leads: 0 };
      }
      byPlatform[plat].count += 1;
      byPlatform[plat].spent += spent;
      byPlatform[plat].leads += leads;
    });

    const avgCpl = totalLeads > 0 ? totalSpent / totalLeads : 0;
    const avgRoas = campaignsWithRoas > 0 ? sumRoas / campaignsWithRoas : 0;

    return {
      activeCampaignsCount: campaigns.filter((c) => c.status === 'ACTIVE').length,
      totalCampaigns: campaigns.length,
      totalBudget,
      totalSpent,
      totalLeads,
      avgCpl,
      avgRoas,
      byPlatform,
    };
  }

  // =========================================================================
  // 4. CRONOGRAMA & CALENDÁRIO
  // =========================================================================

  async getSchedule(tenantId: string, start?: string, end?: string, clientId?: string) {
    const where: any = {
      tenantId,
      OR: [{ dueDate: { not: null } }, { publishDate: { not: null } }],
    };

    if (clientId && clientId !== 'ALL') {
      where.marketingClientId = clientId;
    }

    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      where.AND = [
        {
          OR: [
            { dueDate: { gte: startDate, lte: endDate } },
            { publishDate: { gte: startDate, lte: endDate } },
          ],
        },
      ];
    }

    return this.prisma.marketingCard.findMany({
      where,
      include: {
        marketingClient: {
          select: {
            id: true,
            name: true,
            brandColor: true,
            logoUrl: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [{ publishDate: 'asc' }, { dueDate: 'asc' }],
    });
  }

  // =========================================================================
  // 5. PONTO ELETRÔNICO & MONITORAMENTO POR SESSÃO (HASH DE AUDITORIA)
  // =========================================================================

  async logTime(
    tenantId: string,
    userId: string,
    dto: TimeClockDto,
    ipAddress?: string,
    userAgent?: string
  ) {
    const now = new Date();
    const cleanIp = ipAddress || '127.0.0.1';
    const salt = process.env.JWT_SECRET || 'versus-audit-salt-2026';

    // Gerar hash de auditoria criptográfico atrelado a login, IP, timestamp e tenant
    const rawAuditPayload = `${userId}:${tenantId}:${dto.type}:${now.toISOString()}:${cleanIp}:${salt}`;
    const sessionHash = crypto.createHash('sha256').update(rawAuditPayload).digest('hex');

    const log = await this.prisma.marketingTimeLog.create({
      data: {
        tenantId,
        userId,
        type: dto.type,
        timestamp: now,
        sessionHash,
        ipAddress: cleanIp,
        userAgent: userAgent || 'Browser Client',
        notes: dto.notes || null,
      },
    });

    return {
      success: true,
      message: `Ponto registrado com sucesso: ${dto.type}`,
      log: {
        id: log.id,
        type: log.type,
        timestamp: log.timestamp,
        sessionHash: log.sessionHash,
        ipAddress: log.ipAddress,
      },
    };
  }

  async getTodayTimeStatus(tenantId: string, userId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayLogs = await this.prisma.marketingTimeLog.findMany({
      where: {
        tenantId,
        userId,
        timestamp: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    const lastLog = todayLogs.length > 0 ? todayLogs[todayLogs.length - 1] : null;

    let currentState: 'NOT_STARTED' | 'ACTIVE' | 'PAUSED' | 'ENDED' = 'NOT_STARTED';
    if (lastLog) {
      if (lastLog.type === 'ENTRADA' || lastLog.type === 'RETORNO') {
        currentState = 'ACTIVE';
      } else if (lastLog.type === 'PAUSA') {
        currentState = 'PAUSED';
      } else if (lastLog.type === 'SAIDA') {
        currentState = 'ENDED';
      }
    }

    // Calcular tempo ativo acumulado hoje em minutos
    let activeMinutes = 0;
    let openIntervalStart: Date | null = null;

    for (const log of todayLogs) {
      if (log.type === 'ENTRADA' || log.type === 'RETORNO') {
        openIntervalStart = new Date(log.timestamp);
      } else if (log.type === 'PAUSA' || log.type === 'SAIDA') {
        if (openIntervalStart) {
          const diffMs = new Date(log.timestamp).getTime() - openIntervalStart.getTime();
          activeMinutes += Math.max(0, Math.floor(diffMs / 60000));
          openIntervalStart = null;
        }
      }
    }

    // Se ainda estiver ativo agora, somar intervalo corrente
    if (openIntervalStart && currentState === 'ACTIVE') {
      const diffMs = Date.now() - openIntervalStart.getTime();
      activeMinutes += Math.max(0, Math.floor(diffMs / 60000));
    }

    return {
      currentState,
      lastAction: lastLog ? { type: lastLog.type, timestamp: lastLog.timestamp, sessionHash: lastLog.sessionHash } : null,
      activeMinutes,
      activeHoursFormatted: `${Math.floor(activeMinutes / 60)}h ${activeMinutes % 60}m`,
      todayLogs: todayLogs.map((l) => ({
        id: l.id,
        type: l.type,
        timestamp: l.timestamp,
        sessionHash: l.sessionHash,
        ipAddress: l.ipAddress,
        notes: l.notes,
      })),
    };
  }

  async getTimeHistory(tenantId: string, userId?: string, limit: number = 50) {
    const where: any = { tenantId };
    if (userId) where.userId = userId;

    return this.prisma.marketingTimeLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
}
