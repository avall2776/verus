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
exports.TenantGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let TenantGuard = class TenantGuard {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.UnauthorizedException({
                code: 'UNAUTHORIZED',
                message: 'Acesso negado: Usuário não autenticado.',
            });
        }
        const isSuperAdmin = Boolean(user.isSuperAdmin === true ||
            String(user.role).toUpperCase() === 'SUPER_ADMIN' ||
            String(user.role).toUpperCase() === 'SUPERADMIN');
        if (isSuperAdmin) {
            return true;
        }
        const tenantId = user.tenantId;
        if (!tenantId) {
            throw new common_1.UnauthorizedException({
                code: 'TENANT_REQUIRED',
                message: 'Acesso negado: Contexto de empresa ausente.',
            });
        }
        let isTenantActive = user.tenant?.isActive;
        if (isTenantActive === undefined) {
            const tenant = await this.prisma.tenant.findUnique({
                where: { id: tenantId },
                select: { id: true, name: true, isActive: true },
            });
            if (!tenant) {
                throw new common_1.UnauthorizedException({
                    code: 'TENANT_NOT_FOUND',
                    message: 'Empresa não encontrada no sistema.',
                });
            }
            isTenantActive = tenant.isActive;
        }
        if (!isTenantActive) {
            throw new common_1.UnauthorizedException({
                code: 'TENANT_BLOCKED',
                message: 'Acesso suspenso: sua empresa está bloqueada pela administração do VERSUS.',
            });
        }
        return true;
    }
};
exports.TenantGuard = TenantGuard;
exports.TenantGuard = TenantGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenantGuard);
//# sourceMappingURL=tenant.guard.js.map