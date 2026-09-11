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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
let DashboardService = class DashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardData(tenantId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalLeadsToday, totalContacts, totalDeals, waitingHuman, pipelineRevenueResult, recentLeadsRaw] = await Promise.all([
            this.prisma.contact.count({ where: { tenantId, createdAt: { gte: today } } }),
            this.prisma.contact.count({ where: { tenantId } }),
            this.prisma.deal.count({ where: { tenantId } }),
            this.prisma.conversation.count({ where: { tenantId, status: 'human_takeover' } }),
            this.prisma.deal.aggregate({ where: { tenantId }, _sum: { value: true } }),
            this.prisma.contact.findMany({
                where: { tenantId },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: { deals: true }
            })
        ]);
        const qualRate = totalContacts > 0 ? Math.round((totalDeals / totalContacts) * 100) : 0;
        const pipelineRevenue = pipelineRevenueResult._sum.value ? pipelineRevenueResult._sum.value.toNumber() : 0;
        const recentLeads = recentLeadsRaw.map((c, idx) => {
            let temp = c.deals.length > 0 ? 'Quente' : 'Frio';
            let value = c.deals.reduce((acc, d) => acc + (d.value ? d.value.toNumber() : 0), 0);
            return {
                id: c.id,
                name: c.name,
                source: c.source,
                temp,
                time: c.createdAt.toISOString(),
                value: value > 0 ? `R$ ${value}` : '-'
            };
        });
        const chartData = [40, 65, 45, 80, 55, 90, 75];
        return {
            kpis: { totalLeadsToday, qualRate, waitingHuman, pipelineRevenue },
            recentLeads,
            chartData
        };
    }
    async getAtendimentoMetrics(tenantId) {
        const tma = '8m 45s';
        const tmr = '2m 10s';
        const [totalConversations, resolvedConversations] = await Promise.all([
            this.prisma.conversation.count({ where: { tenantId } }),
            this.prisma.conversation.count({ where: { tenantId, status: 'resolved' } })
        ]);
        const weeklyVolume = [
            { name: 'Seg', volume: Math.floor(Math.random() * 50) + 10 },
            { name: 'Ter', volume: Math.floor(Math.random() * 50) + 20 },
            { name: 'Qua', volume: Math.floor(Math.random() * 50) + 30 },
            { name: 'Qui', volume: Math.floor(Math.random() * 50) + 15 },
            { name: 'Sex', volume: Math.floor(Math.random() * 50) + 40 },
            { name: 'Sáb', volume: Math.floor(Math.random() * 30) + 5 },
            { name: 'Dom', volume: Math.floor(Math.random() * 20) + 2 },
        ];
        const operatorsRaw = await this.prisma.user.findMany({
            where: { tenantId, role: 'AGENT' },
            select: { id: true, name: true }
        });
        const operators = operatorsRaw.map(op => ({
            id: op.id,
            name: op.name,
            resolved: Math.floor(Math.random() * 30)
        })).sort((a, b) => b.resolved - a.resolved);
        return {
            tma,
            tmr,
            totalConversations,
            resolvedConversations,
            weeklyVolume,
            operators
        };
    }
    async getCrmMetrics(tenantId) {
        const deals = await this.prisma.deal.findMany({ where: { tenantId } });
        let totalRevenue = 0;
        let wonRevenue = 0;
        let lostRevenue = 0;
        let wonCount = 0;
        let lostCount = 0;
        let openCount = 0;
        const stageDistribution = {};
        deals.forEach(deal => {
            const val = deal.value ? deal.value.toNumber() : 0;
            totalRevenue += val;
            const stage = deal.status.toLowerCase();
            if (stage === 'ganho') {
                wonRevenue += val;
                wonCount++;
            }
            else if (stage === 'perdido') {
                lostRevenue += val;
                lostCount++;
            }
            else {
                openCount++;
            }
            stageDistribution[stage] = (stageDistribution[stage] || 0) + 1;
        });
        const totalClosed = wonCount + lostCount;
        const winRate = totalClosed > 0 ? Math.round((wonCount / totalClosed) * 100) : 0;
        const weeklyComparison = [
            { name: 'Sem 1', ganho: 1200, perdido: 400 },
            { name: 'Sem 2', ganho: 2100, perdido: 800 },
            { name: 'Sem 3', ganho: 800, perdido: 1200 },
            { name: 'Sem 4', ganho: Math.floor(wonRevenue / 2) || 2500, perdido: Math.floor(lostRevenue / 2) || 300 }
        ];
        const funnelData = Object.entries(stageDistribution).map(([stage, count]) => ({
            name: stage.toUpperCase(),
            value: count
        }));
        if (funnelData.length === 0) {
            funnelData.push({ name: 'NOVO', value: 12 }, { name: 'NEGOCIAÇÃO', value: 8 }, { name: 'GANHO', value: 4 });
        }
        return {
            totalRevenue,
            wonRevenue,
            lostRevenue,
            wonCount,
            lostCount,
            openCount,
            winRate,
            weeklyComparison,
            funnelData
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map