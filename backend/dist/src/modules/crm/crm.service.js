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
exports.CrmService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const automations_service_1 = require("../automations/automations.service");
let CrmService = class CrmService {
    constructor(prisma, automationsService) {
        this.prisma = prisma;
        this.automationsService = automationsService;
    }
    async findAllDeals(tenantId) {
        return this.prisma.deal.findMany({
            where: { tenantId },
            include: {
                contact: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        tags: true,
                    }
                },
                assignee: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
    }
    async findTenantUsers(tenantId) {
        return this.prisma.user.findMany({
            where: { tenantId },
            select: { id: true, name: true, email: true, role: true }
        });
    }
    async createDeal(tenantId, data) {
        return this.prisma.deal.create({
            data: {
                tenantId,
                ...data
            }
        });
    }
    async updateDeal(tenantId, id, data) {
        const deal = await this.prisma.deal.findUnique({ where: { id } });
        if (!deal || deal.tenantId !== tenantId)
            throw new common_1.NotFoundException('Deal não encontrado');
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
};
exports.CrmService = CrmService;
exports.CrmService = CrmService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        automations_service_1.AutomationsService])
], CrmService);
//# sourceMappingURL=crm.service.js.map