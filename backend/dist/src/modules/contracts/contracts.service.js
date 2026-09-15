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
exports.ContractsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
let ContractsService = class ContractsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId) {
        return this.prisma.contract.findMany({
            where: { tenantId },
            include: {
                proposal: {
                    include: {
                        lead: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                            },
                        },
                        items: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(tenantId, id) {
        const contract = await this.prisma.contract.findFirst({
            where: { id, tenantId },
            include: {
                proposal: {
                    include: {
                        lead: true,
                        deal: true,
                        items: true,
                    },
                },
            },
        });
        if (!contract) {
            throw new common_1.NotFoundException('Contrato não encontrado');
        }
        return contract;
    }
    async create(tenantId, dto) {
        const proposal = await this.prisma.proposal.findFirst({
            where: { id: dto.proposalId, tenantId },
        });
        if (!proposal) {
            throw new common_1.NotFoundException('Proposta vinculada não encontrada no tenant');
        }
        return this.prisma.contract.create({
            data: {
                tenantId,
                proposalId: dto.proposalId,
                status: dto.status || 'PENDING_SIGNATURE',
                documentUrl: dto.documentUrl || null,
                auditLogUrl: dto.auditLogUrl || null,
            },
            include: {
                proposal: {
                    include: {
                        lead: true,
                        items: true,
                    },
                },
            },
        });
    }
    async updateStatus(tenantId, id, dto) {
        const contract = await this.findOne(tenantId, id);
        const data = {
            status: dto.status,
        };
        if (dto.status === 'SIGNED' && !contract.signedAt) {
            data.signedAt = new Date();
        }
        if (dto.documentUrl) {
            data.documentUrl = dto.documentUrl;
        }
        if (dto.auditLogUrl) {
            data.auditLogUrl = dto.auditLogUrl;
        }
        return this.prisma.contract.update({
            where: { id: contract.id },
            data,
            include: {
                proposal: {
                    include: {
                        lead: true,
                        items: true,
                    },
                },
            },
        });
    }
};
exports.ContractsService = ContractsService;
exports.ContractsService = ContractsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContractsService);
//# sourceMappingURL=contracts.service.js.map