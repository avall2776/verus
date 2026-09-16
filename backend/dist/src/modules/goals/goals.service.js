"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const client_1 = require("@prisma/client");
let GoalsService = class GoalsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    isWon(status) {
        const s = (status || '').toLowerCase();
        return s === 'won' || s === 'ganho' || s === 'closed_won' || s === 'aprovado' || s === 'concluido' || s === 'signed';
    }
    async getSummary(tenantId, channel) {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
        const totalDays = endOfMonth.getDate();
        const daysPassed = Math.max(1, now.getDate());
        const daysRemaining = Math.max(0, totalDays - daysPassed);
        const revenueGoals = await this.prisma.goal.findMany({
            where: {
                tenantId,
                targetType: 'REVENUE',
                periodStart: { lte: endOfMonth },
                periodEnd: { gte: startOfMonth },
            },
        });
        const totalRevenueTarget = revenueGoals.reduce((acc, g) => acc + Number(g.targetValue || 0), 0);
        const dealWhere = {
            tenantId,
            createdAt: { gte: startOfMonth, lte: endOfMonth },
        };
        if (channel && channel !== 'all') {
            dealWhere.contact = {
                source: { contains: channel, mode: 'insensitive' },
            };
        }
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
        const contractsRevenue = signedContracts.reduce((acc, c) => acc + Number(c.value || 0), 0);
        const totalRevenueWon = Math.max(dealsRevenue, contractsRevenue);
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
        let healthStatus = 'on_track';
        if (totalRevenueWon >= totalRevenueTarget) {
            healthStatus = 'achieved';
        }
        else if (runRatePercentage >= 95) {
            healthStatus = 'on_track';
        }
        else if (runRatePercentage >= 75) {
            healthStatus = 'at_risk';
        }
        else {
            healthStatus = 'behind';
        }
        const leaderboard = await this.getLeaderboard(tenantId);
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
    async findAll(tenantId) {
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
        const enriched = await Promise.all(goals.map(async (goal) => {
            const calculatedCurrent = await this.calculateCurrentMetric(tenantId, goal.targetType, goal.periodStart, goal.periodEnd, goal.userId || undefined);
            const targetVal = Number(goal.targetValue) || 1;
            const progressPercentage = Math.min(100, Math.round((calculatedCurrent / targetVal) * 100));
            const start = new Date(goal.periodStart).getTime();
            const end = new Date(goal.periodEnd).getTime();
            const totalDurationDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
            const elapsedDays = Math.max(1, Math.min(totalDurationDays, Math.round((now.getTime() - start) / (1000 * 60 * 60 * 24))));
            const remainingDays = Math.max(0, totalDurationDays - elapsedDays);
            const dailyAvg = calculatedCurrent / elapsedDays;
            const projected = calculatedCurrent + (dailyAvg * remainingDays);
            const projectionRate = targetVal > 0 ? +((projected / targetVal) * 100).toFixed(1) : 100;
            let status = 'on_track';
            if (calculatedCurrent >= targetVal) {
                status = 'achieved';
            }
            else if (projectionRate >= 95) {
                status = 'on_track';
            }
            else if (projectionRate >= 75) {
                status = 'at_risk';
            }
            else {
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
        }));
        return enriched;
    }
    async create(tenantId, dto) {
        const periodStart = new Date(dto.periodStart);
        const periodEnd = new Date(dto.periodEnd);
        const initialCurrent = await this.calculateCurrentMetric(tenantId, dto.targetType, periodStart, periodEnd, dto.userId);
        return this.prisma.goal.create({
            data: {
                tenantId,
                title: dto.title || `Meta de ${dto.targetType}`,
                userId: dto.userId || null,
                targetType: dto.targetType,
                targetValue: new client_1.Prisma.Decimal(dto.targetValue),
                currentValue: new client_1.Prisma.Decimal(initialCurrent),
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
    async update(tenantId, id, dto) {
        const existing = await this.prisma.goal.findFirst({
            where: { id, tenantId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Meta não encontrada ou sem permissão.');
        }
        const data = {};
        if (dto.title !== undefined)
            data.title = dto.title;
        if (dto.targetType !== undefined)
            data.targetType = dto.targetType;
        if (dto.targetValue !== undefined)
            data.targetValue = new client_1.Prisma.Decimal(dto.targetValue);
        if (dto.periodStart !== undefined)
            data.periodStart = new Date(dto.periodStart);
        if (dto.periodEnd !== undefined)
            data.periodEnd = new Date(dto.periodEnd);
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
    async delete(tenantId, id) {
        const existing = await this.prisma.goal.findFirst({
            where: { id, tenantId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Meta não encontrada ou sem permissão.');
        }
        await this.prisma.goal.delete({
            where: { id },
        });
        return { success: true, message: 'Meta removida com sucesso.' };
    }
    async getLeaderboard(tenantId) {
        const users = await this.prisma.user.findMany({
            where: { tenantId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });
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
        const userStats = users.map((u) => {
            const userDeals = deals.filter((d) => d.assignedTo === u.id);
            const wonDeals = userDeals.filter((d) => this.isWon(d.status));
            const totalRevenueWon = wonDeals.reduce((acc, d) => acc + Number(d.value || 0), 0);
            const totalDeals = userDeals.length;
            const conversionRate = totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0;
            const avgTicket = wonDeals.length > 0 ? Math.round(totalRevenueWon / wonDeals.length) : 0;
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
                totalDeals,
                dealsWon: wonDeals.length,
                dealsCount: wonDeals.length,
                revenueWon: totalRevenueWon,
                achievedValue: totalRevenueWon,
                targetValue,
                percentAchieved,
                conversionRate,
                avgTicket,
            };
        });
        userStats.sort((a, b) => {
            if (b.revenueWon !== a.revenueWon) {
                return b.revenueWon - a.revenueWon;
            }
            return b.dealsWon - a.dealsWon;
        });
        return userStats.map((stat, index) => {
            let badgeTier = 'participant';
            if (index === 0)
                badgeTier = 'gold';
            else if (index === 1)
                badgeTier = 'silver';
            else if (index === 2)
                badgeTier = 'bronze';
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
    async getSellerDetails(tenantId, userId) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, tenantId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('Vendedor não encontrado no tenant.');
        }
        const deals = await this.prisma.deal.findMany({
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
        const wonDeals = deals.filter((d) => this.isWon(d.status));
        const totalRevenueWon = wonDeals.reduce((acc, d) => acc + Number(d.value || 0), 0);
        const conversionRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;
        const avgTicket = wonDeals.length > 0 ? Math.round(totalRevenueWon / wonDeals.length) : 0;
        const badges = this.computeBadges({
            dealsWon: wonDeals.length,
            totalDeals: deals.length,
            totalRevenueWon,
            conversionRate,
            avgTicket,
        });
        return {
            user,
            metrics: {
                totalDeals: deals.length,
                dealsWon: wonDeals.length,
                totalRevenueWon,
                conversionRate,
                avgTicket,
            },
            badges,
            recentDeals: deals.map((d) => ({
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
    computeBadges(metrics) {
        const badges = [];
        const target = Number(metrics.targetValue || 0);
        if (target > 0 && metrics.totalRevenueWon >= target) {
            badges.push({
                id: 'target_met',
                title: 'Meta Batida (100%+)',
                icon: '🏆',
                description: 'Superou a meta estipulada para o ciclo.',
                color: 'blue',
            });
        }
        if (metrics.avgTicket >= 8000) {
            badges.push({
                id: 'high_ticket',
                title: 'Ticket Destaque',
                icon: '💎',
                description: 'Ticket médio superior a R$ 8.000 por contrato fechado.',
                color: 'cyan',
            });
        }
        if (metrics.conversionRate >= 40 && metrics.dealsWon >= 2) {
            badges.push({
                id: 'elite_closer',
                title: 'Closer de Elite',
                icon: '⚡',
                description: 'Taxa de conversão superior a 40% em oportunidades ativas.',
                color: 'amber',
            });
        }
        if (metrics.dealsWon >= 5 || metrics.rank === 1) {
            badges.push({
                id: 'top_volume',
                title: 'Volume Máximo',
                icon: '🚀',
                description: 'Liderança destacada no volume de contratos fechados.',
                color: 'blue',
            });
        }
        if (metrics.conversionRate >= 70 && metrics.totalDeals >= 2) {
            badges.push({
                id: 'sniper',
                title: 'Atirador de Elite',
                icon: '🎯',
                description: 'Conversão cirúrgica de propostas em vendas (>70%).',
                color: 'purple',
            });
        }
        if (metrics.dealsWon >= 1 && badges.length === 0) {
            badges.push({
                id: 'first_blood',
                title: 'Primeira Venda',
                icon: '⭐',
                description: 'Primeiro contrato do ciclo fechado com sucesso.',
                color: 'blue',
            });
        }
        return badges;
    }
    async calculateCurrentMetric(tenantId, targetType, periodStart, periodEnd, userId) {
        if (targetType === 'REVENUE') {
            const where = {
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
            const where = {
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
};
exports.GoalsService = GoalsService;
exports.GoalsService = GoalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GoalsService);
//# sourceMappingURL=goals.service.js.map