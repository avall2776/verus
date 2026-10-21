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
var PublicApiKeyGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicApiKeyGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/database/prisma.service");
let PublicApiKeyGuard = PublicApiKeyGuard_1 = class PublicApiKeyGuard {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(PublicApiKeyGuard_1.name);
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'] || '';
        const xApiKey = request.headers['x-api-key'] || request.headers['x-token'] || '';
        let token = '';
        if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7).trim();
        }
        else if (typeof xApiKey === 'string' && xApiKey.trim()) {
            token = xApiKey.trim();
        }
        else if (typeof request.query?.api_key === 'string' && request.query.api_key.trim()) {
            token = request.query.api_key.trim();
        }
        if (!token) {
            throw new common_1.UnauthorizedException({
                success: false,
                code: 'MISSING_API_KEY',
                message: 'Chave de API não fornecida. Envie o cabeçalho Authorization: Bearer <TOKEN> ou x-api-key: <TOKEN>.',
                help: 'Gere um token em Configurações > APIs no painel VERSUS.'
            });
        }
        const apiToken = await this.prisma.apiToken.findUnique({
            where: { token },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        isActive: true,
                    }
                }
            }
        });
        if (!apiToken || !apiToken.isActive) {
            throw new common_1.UnauthorizedException({
                success: false,
                code: 'INVALID_API_KEY',
                message: 'Chave de API inválida ou revogada.',
            });
        }
        if (!apiToken.tenant || !apiToken.tenant.isActive) {
            throw new common_1.ForbiddenException({
                success: false,
                code: 'TENANT_INACTIVE',
                message: 'A empresa vinculada a esta chave de API está inativa ou bloqueada.',
            });
        }
        this.prisma.apiToken.update({
            where: { id: apiToken.id },
            data: { lastUsedAt: new Date() }
        }).catch(err => this.logger.warn(`Falha ao registrar lastUsedAt para token ${apiToken.id}: ${err.message}`));
        request.tenantId = apiToken.tenantId;
        request.tenant = apiToken.tenant;
        request.apiToken = apiToken;
        return true;
    }
};
exports.PublicApiKeyGuard = PublicApiKeyGuard;
exports.PublicApiKeyGuard = PublicApiKeyGuard = PublicApiKeyGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PublicApiKeyGuard);
//# sourceMappingURL=public-api-key.guard.js.map