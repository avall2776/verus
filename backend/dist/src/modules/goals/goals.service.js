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
        const enriched = await Promise.all(goals.map(async (goal) => {
            const calculatedCurrent = await this.calculateCurrentMetric(tenantId, goal.targetType, goal.periodStart, goal.periodEnd, goal.userId || undefined);
            return {
                ...goal,
                currentValue: calculatedCurrent,
                progressPercentage: Number(goal.targetValue) > 0
                    ? Math.min(100, Math.round((calculatedCurrent / Number(goal.targetValue)) * 100))
                    : 0,
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
    async getLeaderboard(tenantId) {
        const users = await this.prisma.user.findMany({
            where: { tenantId },
            select: {
                id: true,
                name: true,
                email: true,
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
        const isWon = (status) => {
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
    async calculateCurrentMetric(tenantId, targetType, periodStart, periodEnd, userId) {
        const isWon = (status) => {
            const s = (status || '').toLowerCase();
            return s === 'won' || s === 'ganho' || s === 'closed_won' || s === 'aprovado' || s === 'concluido';
        };
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
            const won = deals.filter((d) => isWon(d.status));
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
};
exports.GoalsService = GoalsService;
exports.GoalsService = GoalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GoalsService);
//# sourceMappingURL=goals.service.js.map