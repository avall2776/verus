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
    async findOneDeal(tenantId, id) {
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
            throw new common_1.NotFoundException('Oportunidade não encontrada');
        }
        return deal;
    }
    async findTenantUsers(tenantId) {
        return this.prisma.user.findMany({
            where: { tenantId },
            select: { id: true, name: true, email: true, role: true }
        });
    }
    async createDeal(tenantId, data) {
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