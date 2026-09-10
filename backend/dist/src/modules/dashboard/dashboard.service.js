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
    async getMetrics(tenantId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalLeadsToday, totalContacts, totalDeals, waitingHuman, pipelineRevenueResult, recentLeadsRaw] = await Promise.all([
            this.prisma.contact.count({
                where: { tenantId, createdAt: { gte: today } }
            }),
            this.prisma.contact.count({
                where: { tenantId }
            }),
            this.prisma.deal.count({
                where: { tenantId }
            }),
            this.prisma.conversation.count({
                where: { tenantId, status: 'human_takeover' }
            }),
            this.prisma.deal.aggregate({
                where: { tenantId },
                _sum: { value: true }
            }),
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
            kpis: {
                totalLeadsToday,
                qualRate,
                waitingHuman,
                pipelineRevenue
            },
            recentLeads,
            chartData
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map