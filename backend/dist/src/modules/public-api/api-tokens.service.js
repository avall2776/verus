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
var ApiTokensService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiTokensService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const crypto = require("crypto");
let ApiTokensService = ApiTokensService_1 = class ApiTokensService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ApiTokensService_1.name);
    }
    async listTokens(tenantId) {
        return this.prisma.apiToken.findMany({
            where: { tenantId },
            select: {
                id: true,
                name: true,
                tokenPrefix: true,
                isActive: true,
                lastUsedAt: true,
                createdBy: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async createToken(tenantId, name, permissions, createdBy) {
        if (!name || !name.trim()) {
            throw new common_1.BadRequestException('Informe um nome descritivo para o Token de API (ex: "Meta Ads - Tráfego Pago").');
        }
        const randomHex = crypto.randomBytes(24).toString('hex');
        const rawToken = `vrs_live_${randomHex}`;
        const tokenPrefix = `vrs_live_${randomHex.substring(0, 4)}...${randomHex.slice(-4)}`;
        const tokenRecord = await this.prisma.apiToken.create({
            data: {
                tenantId,
                name: name.trim(),
                token: rawToken,
                tokenPrefix,
                permissions: permissions || { leads: true, contacts: true, deals: true },
                isActive: true,
                createdBy: createdBy || 'Administrador',
            },
        });
        this.logger.log(`Novo token de API criado para tenant [${tenantId}]: "${name}"`);
        return {
            success: true,
            message: 'Token de API gerado com sucesso.',
            token: rawToken,
            data: {
                id: tokenRecord.id,
                name: tokenRecord.name,
                tokenPrefix: tokenRecord.tokenPrefix,
                isActive: tokenRecord.isActive,
                createdAt: tokenRecord.createdAt,
            },
        };
    }
    async toggleToken(tenantId, id) {
        const existing = await this.prisma.apiToken.findFirst({
            where: { id, tenantId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Token de API não encontrado.');
        }
        const updated = await this.prisma.apiToken.update({
            where: { id },
            data: { isActive: !existing.isActive },
        });
        return {
            success: true,
            message: updated.isActive ? 'Token ativado com sucesso.' : 'Token desativado com sucesso.',
            data: updated,
        };
    }
    async deleteToken(tenantId, id) {
        const existing = await this.prisma.apiToken.findFirst({
            where: { id, tenantId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Token de API não encontrado.');
        }
        await this.prisma.apiToken.delete({
            where: { id },
        });
        this.logger.log(`Token de API revogado [${id}] para tenant [${tenantId}]`);
        return {
            success: true,
            message: 'Token de API revogado e excluído com sucesso.',
        };
    }
};
exports.ApiTokensService = ApiTokensService;
exports.ApiTokensService = ApiTokensService = ApiTokensService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ApiTokensService);
//# sourceMappingURL=api-tokens.service.js.map