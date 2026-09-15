import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Update / enrich currentValue dynamically based on actual DB metrics
    const enriched = await Promise.all(
      goals.map(async (goal) => {
        const calculatedCurrent = await this.calculateCurrentMetric(
          tenantId,
          goal.targetType,
          goal.periodStart,
          goal.periodEnd,
          goal.userId || undefined,
        );

        return {
          ...goal,
          currentValue: calculatedCurrent,
          progressPercentage: Number(goal.targetValue) > 0
            ? Math.min(100, Math.round((calculatedCurrent / Number(goal.targetValue)) * 100))
            : 0,
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

  async getLeaderboard(tenantId: string) {
    // Get all users in tenant
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Get all deals for tenant
    const deals = await this.prisma.deal.findMany({
      where: { tenantId },
      select: {
        id: true,
        assignedTo: true,
        status: true,
        value: true,
        createdAt: true,
      },
    });

    const isWon = (status: string) => {
      const s = (status || '').toLowerCase();
      return s === 'won' || s === 'ganho' || s === 'closed_won' || s === 'aprovado' || s === 'concluido';
    };

    const userStats = users.map((u) => {
      const userDeals = deals.filter((d) => d.assignedTo === u.id);
      const wonDeals = userDeals.filter((d) => isWon(d.status));
      const totalRevenueWon = wonDeals.reduce((acc, d) => acc + Number(d.value || 0), 0);
      const totalDeals = userDeals.length;
      const conversionRate = totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0;

      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: null,
        totalDeals,
        dealsWon: wonDeals.length,
        revenueWon: totalRevenueWon,
        conversionRate,
      };
    });

    // Sort descending by revenueWon, then dealsWon
    userStats.sort((a, b) => {
      if (b.revenueWon !== a.revenueWon) {
        return b.revenueWon - a.revenueWon;
      }
      return b.dealsWon - a.dealsWon;
    });

    return userStats.map((stat, index) => ({
      rank: index + 1,
      ...stat,
    }));
  }

  private async calculateCurrentMetric(
    tenantId: string,
    targetType: string,
    periodStart: Date,
    periodEnd: Date,
    userId?: string,
  ): Promise<number> {
    const isWon = (status: string) => {
      const s = (status || '').toLowerCase();
      return s === 'won' || s === 'ganho' || s === 'closed_won' || s === 'aprovado' || s === 'concluido';
    };

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
      const won = deals.filter((d) => isWon(d.status));
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
      return deals.filter((d) => isWon(d.status)).length;
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
