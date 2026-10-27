import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  private isWon(status: string): boolean {
    const s = (status || '').toLowerCase();
    return s === 'won' || s === 'ganho' || s === 'closed_won' || s === 'aprovado' || s === 'concluido' || s === 'signed';
  }

  async getSummary(tenantId: string, channel?: string, monthStr?: string, yearStr?: string) {
    const now = new Date();
    const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();
    const month = monthStr !== undefined && monthStr !== '' ? parseInt(monthStr, 10) : now.getMonth();

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const totalDays = endOfMonth.getDate();
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
    const daysPassed = isCurrentMonth ? Math.max(1, now.getDate()) : totalDays;
    const daysRemaining = isCurrentMonth ? Math.max(0, totalDays - daysPassed) : 0;

    // 1. Busca todas as metas de faturamento ativas do mês
    const revenueGoals = await this.prisma.goal.findMany({
      where: {
        tenantId,
        targetType: 'REVENUE',
        periodStart: { lte: endOfMonth },
        periodEnd: { gte: startOfMonth },
      },
    });

    const totalRevenueTarget = revenueGoals.reduce(
      (acc, g) => acc + Number(g.targetValue || 0),
      0,
    );

    // 2. Filtro opcional por canal de aquisição
    const dealWhere: Prisma.DealWhereInput = {
      tenantId,
      createdAt: { gte: startOfMonth, lte: endOfMonth },
    };

    if (channel && channel !== 'all') {
      dealWhere.contact = {
        source: { contains: channel, mode: 'insensitive' },
      };
    }

    // Calcula receita real realizada no período (Deals Ganhos + Contratos Assinados)
    const wonDeals = await this.prisma.deal.findMany({
      where: dealWhere,
      select: { id: true, status: true, value: true, contact: { select: { source: true } } },
    });

    const dealsRevenue = wonDeals
      .filter((d) => this.isWon(d.status))
      .reduce((acc, d) => acc + Number(d.value || 0), 0);

    const signedContracts = await this.prisma.contract.findMany({
      where: {
        tenantId,
        status: 'SIGNED',
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
      select: { id: true, value: true },
    });

    const contractsRevenue = signedContracts.reduce(
      (acc, c) => acc + Number(c.value || 0),
      0,
    );

    // Receita estritamente real do banco (Deals ganhos ou Contratos assinados)
    const totalRevenueWon = Math.max(dealsRevenue, contractsRevenue);

    // 3. Cálculos de Run Rate Matemático
    const dailyPace = daysPassed > 0 ? +(totalRevenueWon / daysPassed).toFixed(2) : 0;
    const projectedRevenue = +(totalRevenueWon + (dailyPace * daysRemaining)).toFixed(2);
    const runRatePercentage = totalRevenueTarget > 0
      ? +((projectedRevenue / totalRevenueTarget) * 100).toFixed(1)
      : 100;

    const progressPercentage = totalRevenueTarget > 0
      ? Math.min(100, +((totalRevenueWon / totalRevenueTarget) * 100).toFixed(1))
      : 0;

    const requiredDailyPace = daysRemaining > 0
      ? +(Math.max(0, totalRevenueTarget - totalRevenueWon) / daysRemaining).toFixed(2)
      : 0;

    let healthStatus: 'achieved' | 'on_track' | 'at_risk' | 'behind' = 'on_track';
    if (totalRevenueWon >= totalRevenueTarget) {
      healthStatus = 'achieved';
    } else if (runRatePercentage >= 95) {
      healthStatus = 'on_track';
    } else if (runRatePercentage >= 75) {
      healthStatus = 'at_risk';
    } else {
      healthStatus = 'behind';
    }

    // 4. Melhor vendedor atual do ciclo comercial
    const leaderboard = await this.getLeaderboard(tenantId, 'month', String(month), String(year));
    const topSeller = leaderboard[0] || null;

    const expectedPacePercentage = totalDays > 0 ? Math.round((daysPassed / totalDays) * 100) : 0;
    const paceGap = +(progressPercentage - expectedPacePercentage).toFixed(1);

    const availableChannels = [
      { id: 'all', name: 'Todos os Canais' },
      { id: 'whatsapp', name: 'WhatsApp Oficial' },
      { id: 'meta_ads', name: 'Meta Ads (Facebook/Instagram)' },
      { id: 'google_ads', name: 'Google Ads' },
      { id: 'organico', name: 'Orgânico / Site' },
      { id: 'indicacao', name: 'Indicação / Parceiros' },
    ];

    return {
      monthName: now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      totalDays,
      daysPassed,
      daysRemaining,
      totalRevenueTarget,
      totalTarget: totalRevenueTarget,
      totalRevenueWon,
      totalCurrent: totalRevenueWon,
      dailyPace,
      currentDailyPace: dailyPace,
      requiredDailyPace,
      dailyPaceNeeded: requiredDailyPace,
      projectedRevenue,
      runRatePercentage,
      progressPercentage,
      overallProgress: progressPercentage,
      expectedPacePercentage,
      paceGap,
      healthStatus,
      isBaseline: false,
      topSeller,
      goalsCount: revenueGoals.length,
      selectedChannel: channel || 'all',
    };
  }

  async findAll(tenantId: string) {
    const goals = await this.prisma.goal.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    const enriched = await Promise.all(
      goals.map(async (goal) => {
        const calculatedCurrent = await this.calculateCurrentMetric(
          tenantId,
          goal.targetType,
          goal.periodStart,
          goal.periodEnd,
          goal.userId || undefined,
        );

        const targetVal = Number(goal.targetValue) || 1;
        const progressPercentage = Math.min(100, Math.round((calculatedCurrent / targetVal) * 100));

        // Projeção baseada na vigência da meta
        const start = new Date(goal.periodStart).getTime();
        const end = new Date(goal.periodEnd).getTime();
        const totalDurationDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
        const elapsedDays = Math.max(1, Math.min(totalDurationDays, Math.round((now.getTime() - start) / (1000 * 60 * 60 * 24))));
        const remainingDays = Math.max(0, totalDurationDays - elapsedDays);

        const dailyAvg = calculatedCurrent / elapsedDays;
        const projected = calculatedCurrent + (dailyAvg * remainingDays);
        const projectionRate = targetVal > 0 ? +((projected / targetVal) * 100).toFixed(1) : 100;

        let status: 'achieved' | 'on_track' | 'at_risk' | 'behind' = 'on_track';
        if (calculatedCurrent >= targetVal) {
          status = 'achieved';
        } else if (projectionRate >= 95) {
          status = 'on_track';
        } else if (projectionRate >= 75) {
          status = 'at_risk';
        } else {
          status = 'behind';
        }

        return {
          id: goal.id,
          title: goal.title || `Meta de ${goal.targetType}`,
          category: goal.targetType.toLowerCase(),
          targetType: goal.targetType,
          targetValue: targetVal,
          currentValue: calculatedCurrent,
          unit: goal.targetType === 'REVENUE' ? 'currency' : 'count',
          periodStart: goal.periodStart.toISOString().split('T')[0],
          periodEnd: goal.periodEnd.toISOString().split('T')[0],
          startDate: goal.periodStart.toISOString().split('T')[0],
          endDate: goal.periodEnd.toISOString().split('T')[0],
          progressPercentage,
          projectionRate,
          status,
          user: goal.user,
          createdAt: goal.createdAt.toISOString(),
        };
      }),
    );

    return enriched;
  }

  async create(tenantId: string, dto: CreateGoalDto) {
    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);

    const initialCurrent = await this.calculateCurrentMetric(
      tenantId,
      dto.targetType,
      periodStart,
      periodEnd,
      dto.userId,
    );

    return this.prisma.goal.create({
      data: {
        tenantId,
        title: dto.title || `Meta de ${dto.targetType}`,
        userId: dto.userId || null,
        targetType: dto.targetType,
        targetValue: new Prisma.Decimal(dto.targetValue),
        currentValue: new Prisma.Decimal(initialCurrent),
        periodStart,
        periodEnd,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateGoalDto) {
    const existing = await this.prisma.goal.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Meta não encontrada ou sem permissão.');
    }

    const data: Prisma.GoalUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.targetType !== undefined) data.targetType = dto.targetType;
    if (dto.targetValue !== undefined) data.targetValue = new Prisma.Decimal(dto.targetValue);
    if (dto.periodStart !== undefined) data.periodStart = new Date(dto.periodStart);
    if (dto.periodEnd !== undefined) data.periodEnd = new Date(dto.periodEnd);
    if (dto.userId !== undefined) {
      data.user = dto.userId ? { connect: { id: dto.userId } } : { disconnect: true };
    }

    return this.prisma.goal.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async delete(tenantId: string, id: string) {
    const existing = await this.prisma.goal.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Meta não encontrada ou sem permissão.');
    }

    await this.prisma.goal.delete({
      where: { id },
    });

    return { success: true, message: 'Meta removida com sucesso.' };
  }

  private getPeriodDateRange(period?: string, monthStr?: string, yearStr?: string): { startDate?: Date; endDate?: Date } {
    const now = new Date();
    const cleanPeriod = (period || 'month').toLowerCase().trim();

    if (cleanPeriod === 'all' || cleanPeriod === 'total' || cleanPeriod === 'geral' || cleanPeriod === 'tudo') {
      return { startDate: undefined, endDate: undefined };
    }

    const targetYear = yearStr ? parseInt(yearStr, 10) : now.getFullYear();
    const targetMonth = monthStr !== undefined && monthStr !== '' ? parseInt(monthStr, 10) : now.getMonth();

    if (cleanPeriod === 'day' || cleanPeriod === 'today' || cleanPeriod === 'hoje' || cleanPeriod === 'dia') {
      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { startDate, endDate };
    }

    if (cleanPeriod === 'week' || cleanPeriod === 'semana') {
      const dayOfWeek = now.getDay(); // 0 is Sunday
      const diffToMonday = (dayOfWeek + 6) % 7;
      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    }

    // Default: 'month' / 'mes' / 'meses'
    const startDate = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
    return { startDate, endDate };
  }

  private isCommercialUser(user: {
    email?: string | null;
    role?: string | null;
    canAccessMarketing?: boolean | null;
    departments?: { department?: { name?: string | null } | null }[] | null;
  }): boolean {
    const email = (user.email || '').toLowerCase().trim();
    const deptNames = (user.departments || [])
      .map((d) => (d.department?.name || '').trim().toLowerCase())
      .filter(Boolean);

    // 1. Departamentos e tags explicitamente comerciais (ex: "Comercial Geral", "Vendas", "Região 2", etc.)
    const hasCommercialDept = deptNames.some((name) =>
      name.includes('comercial') ||
      name.includes('venda') ||
      name.includes('sales') ||
      name.includes('closer') ||
      name.includes('sdr') ||
      name.includes('bdr') ||
      name.includes('executivo') ||
      name.includes('representante') ||
      name.includes('região') ||
      name.includes('regiao')
    );

    if (hasCommercialDept) {
      return true;
    }

    // 2. Bloqueio estrito de Marketing, Suporte e Administrativo
    const hasMarketingDept = deptNames.some((name) =>
      name.includes('marketing') || name === 'mkt'
    );

    if (hasMarketingDept || user.canAccessMarketing) {
      return false;
    }

    if (email.includes('marketing@') || email.includes('.marketing@')) {
      return false;
    }

    const nonCommercialDepts = [
      'suporte',
      'support',
      'financeiro',
      'finance',
      'rh',
      'recursos humanos',
      'administrativo',
      'ia',
    ];
    const hasOtherNonCommercial = deptNames.some((name) =>
      nonCommercialDepts.some((nc) => name.includes(nc))
    );

    if (hasOtherNonCommercial && !hasCommercialDept) {
      return false;
    }

    // 3. Usuários sem departamentos atribuídos mas que atuam no CRM comercial
    return true;
  }

  async getLeaderboard(
    tenantId: string,
    period: string = 'month',
    monthStr?: string,
    yearStr?: string,
  ) {
    const { startDate, endDate } = this.getPeriodDateRange(period, monthStr, yearStr);

    const users = await this.prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        canAccessMarketing: true,
        departments: {
          include: {
            department: true,
          },
        },
      },
    });

    // Filtra estritamente apenas a equipe comercial (excluindo marketing, suporte, etc.)
    const commercialUsers = users.filter((u) => this.isCommercialUser(u));

    const userGoals = await this.prisma.goal.findMany({
      where: {
        tenantId,
        targetType: 'REVENUE',
      },
      select: {
        id: true,
        userId: true,
        targetValue: true,
      },
    });

    const dealWhere: Prisma.DealWhereInput = { tenantId };
    if (startDate && endDate) {
      dealWhere.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const deals = await this.prisma.deal.findMany({
      where: dealWhere,
      select: {
        id: true,
        assignedTo: true,
        status: true,
        value: true,
        createdAt: true,
      },
    });

    const userStats = commercialUsers.map((u) => {
      const userDeals = deals.filter((d) => d.assignedTo === u.id);
      const wonDeals = userDeals.filter((d) => this.isWon(d.status));
      const totalRevenueWon = wonDeals.reduce((acc, d) => acc + Number(d.value || 0), 0);
      const totalDeals = userDeals.length;
      const conversionRate = totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0;
      const avgTicket = wonDeals.length > 0 ? Math.round(totalRevenueWon / wonDeals.length) : 0;

      // Meta real configurada no banco para o consultor
      const personalGoal = userGoals.find((g) => g.userId === u.id);
      const targetValue = personalGoal ? Number(personalGoal.targetValue || 0) : 0;
      const percentAchieved = targetValue > 0 ? +((totalRevenueWon / targetValue) * 100).toFixed(1) : 0;

      return {
        userId: u.id,
        id: u.id,
        name: u.name || 'Consultor Comercial',
        email: u.email,
        role: u.role || 'Consultor de Vendas',
        avatarUrl: null,
        departments: (u.departments || []).map((d) => (d.department?.name || '').replace(/geral/i, '').trim()).filter(Boolean),
        totalDeals,
        dealsWon: wonDeals.length,
        dealsCount: wonDeals.length,
        revenueWon: totalRevenueWon,
        achievedValue: totalRevenueWon,
        totalRevenueWon,
        targetValue,
        percentAchieved,
        conversionRate,
        avgTicket,
      };
    });

    // Ordenação decrescente por receita, depois por negócios ganhos
    userStats.sort((a, b) => {
      if (b.revenueWon !== a.revenueWon) {
        return b.revenueWon - a.revenueWon;
      }
      return b.dealsWon - a.dealsWon;
    });

    return userStats.map((stat, index) => {
      let badgeTier: 'gold' | 'silver' | 'bronze' | 'participant' = 'participant';
      if (index === 0 && stat.revenueWon > 0) badgeTier = 'gold';
      else if (index === 1 && stat.revenueWon > 0) badgeTier = 'silver';
      else if (index === 2 && stat.revenueWon > 0) badgeTier = 'bronze';

      const rank = index + 1;
      const badges = this.computeBadges({
        dealsWon: stat.dealsWon,
        totalDeals: stat.totalDeals,
        totalRevenueWon: stat.revenueWon,
        conversionRate: stat.conversionRate,
        avgTicket: stat.avgTicket,
        targetValue: stat.targetValue,
        rank,
      });

      return {
        ...stat,
        rank,
        badgeTier,
        badges,
      };
    });
  }

  async getSellerDetails(
    tenantId: string,
    userId: string,
    period: string = 'month',
    monthStr?: string,
    yearStr?: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        departments: {
          include: {
            department: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Vendedor não encontrado no tenant.');
    }

    const { startDate, endDate } = this.getPeriodDateRange(period, monthStr, yearStr);

    const dealWhere: Prisma.DealWhereInput = { tenantId, assignedTo: userId };
    if (startDate && endDate) {
      dealWhere.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    // 1. Busca os negócios do período para calcular KPIs consolidados do consultor
    const allUserDeals = await this.prisma.deal.findMany({
      where: dealWhere,
      select: {
        id: true,
        status: true,
        value: true,
      },
    });

    const totalDeals = allUserDeals.length;
    const wonDeals = allUserDeals.filter((d) => this.isWon(d.status));
    const totalRevenueWon = wonDeals.reduce((acc, d) => acc + Number(d.value || 0), 0);
    const conversionRate = totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0;
    const avgTicket = wonDeals.length > 0 ? Math.round(totalRevenueWon / wonDeals.length) : 0;

    // Meta pessoal do consultor se configurada
    const personalGoal = await this.prisma.goal.findFirst({
      where: { tenantId, userId, targetType: 'REVENUE' },
      select: { targetValue: true },
    });
    const targetValue = personalGoal ? Number(personalGoal.targetValue || 0) : 0;

    const badges = this.computeBadges({
      dealsWon: wonDeals.length,
      totalDeals,
      totalRevenueWon,
      conversionRate,
      avgTicket,
      targetValue,
    });

    // 2. Busca os 20 negócios mais recentes para histórico detalhado
    const recentDeals = await this.prisma.deal.findMany({
      where: { tenantId, assignedTo: userId },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        departments: (user.departments || []).map((d) => (d.department?.name || '').replace(/geral/i, '').trim()).filter(Boolean),
      },
      period: period || 'month',
      metrics: {
        totalDeals,
        dealsWon: wonDeals.length,
        totalRevenueWon,
        conversionRate,
        avgTicket,
        targetValue,
      },
      badges,
      recentDeals: recentDeals.map((d) => ({
        id: d.id,
        title: d.title,
        value: Number(d.value || 0),
        status: d.status,
        isWon: this.isWon(d.status),
        clientName: d.contact?.name || 'Cliente',
        clientCompany: null,
        clientPhone: d.contact?.phone || null,
        createdAt: d.createdAt.toISOString(),
      })),
    };
  }

  private computeBadges(metrics: {
    dealsWon: number;
    totalDeals: number;
    totalRevenueWon: number;
    conversionRate: number;
    avgTicket: number;
    rank?: number;
    targetValue?: number;
  }) {
    const badges: { id: string; title: string; icon: string; description: string; color: string }[] = [];

    // 1. Meta Batida (100%+)
    const target = Number(metrics.targetValue || 0);
    if (target > 0 && metrics.totalRevenueWon >= target) {
      badges.push({
        id: 'target_met',
        title: 'Meta Batida (100%+)',
        icon: 'trophy',
        description: 'Superou a meta estipulada para o ciclo.',
        color: 'amber',
      });
    }

    // 2. Ticket Destaque
    if (metrics.avgTicket >= 8000) {
      badges.push({
        id: 'high_ticket',
        title: 'Ticket Destaque',
        icon: 'gem',
        description: 'Ticket médio superior a R$ 8.000 por contrato fechado.',
        color: 'cyan',
      });
    }

    // 3. Closer de Elite
    if (metrics.conversionRate >= 40 && metrics.dealsWon >= 2) {
      badges.push({
        id: 'elite_closer',
        title: 'Closer de Elite',
        icon: 'zap',
        description: 'Taxa de conversão superior a 40% em oportunidades ativas.',
        color: 'amber',
      });
    }

    // 4. Volume Máximo
    if (metrics.dealsWon >= 5 || metrics.rank === 1) {
      badges.push({
        id: 'top_volume',
        title: 'Volume Máximo',
        icon: 'rocket',
        description: 'Liderança destacada no volume de contratos fechados.',
        color: 'blue',
      });
    }

    // 5. Atirador de Elite
    if (metrics.conversionRate >= 70 && metrics.totalDeals >= 2) {
      badges.push({
        id: 'sniper',
        title: 'Atirador de Elite',
        icon: 'target',
        description: 'Conversão cirúrgica de propostas em vendas (>70%).',
        color: 'purple',
      });
    }

    // 6. Primeira Venda
    if (metrics.dealsWon >= 1 && badges.length === 0) {
      badges.push({
        id: 'first_blood',
        title: 'Primeira Venda',
        icon: 'star',
        description: 'Primeiro contrato do ciclo fechado com sucesso.',
        color: 'emerald',
      });
    }

    return badges;
  }

  private async calculateCurrentMetric(
    tenantId: string,
    targetType: string,
    periodStart: Date,
    periodEnd: Date,
    userId?: string,
  ): Promise<number> {
    if (targetType === 'REVENUE') {
      const where: Prisma.DealWhereInput = {
        tenantId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      };
      if (userId) {
        where.assignedTo = userId;
      }
      const deals = await this.prisma.deal.findMany({ where, select: { status: true, value: true } });
      const won = deals.filter((d) => this.isWon(d.status));
      return won.reduce((acc, d) => acc + Number(d.value || 0), 0);
    }

    if (targetType === 'DEALS') {
      const where: Prisma.DealWhereInput = {
        tenantId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      };
      if (userId) {
        where.assignedTo = userId;
      }
      const deals = await this.prisma.deal.findMany({ where, select: { status: true } });
      return deals.filter((d) => this.isWon(d.status)).length;
    }

    if (targetType === 'LEADS') {
      return this.prisma.contact.count({
        where: {
          tenantId,
          createdAt: {
            gte: periodStart,
            lte: periodEnd,
          },
        },
      });
    }

    return 0;
  }
}

