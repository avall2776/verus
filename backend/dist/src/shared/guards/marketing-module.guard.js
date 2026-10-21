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
exports.MarketingModuleGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let MarketingModuleGuard = class MarketingModuleGuard {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const user = req.user;
        if (!user) {
            throw new common_1.ForbiddenException('Acesso negado: Usuário não autenticado.');
        }
        const role = String(user.role || '').toUpperCase();
        const isSuperAdmin = Boolean(user.isSuperAdmin === true ||
            role === 'SUPER_ADMIN' ||
            role === 'SUPERADMIN');
        if (isSuperAdmin) {
            return true;
        }
        if (role === 'ADMIN') {
            return true;
        }
        if (user.canAccessMarketing === true) {
            return true;
        }
        const perms = user.permissions || {};
        if (perms.marketing === true || perms.modules?.OPERACOES_MARKETING === true) {
            return true;
        }
        const userId = user.userId || user.id;
        if (userId) {
            const dbUser = await this.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    role: true,
                    isSuperAdmin: true,
                    canAccessMarketing: true,
                    permissions: true,
                },
            });
            if (dbUser) {
                if (dbUser.isSuperAdmin || String(dbUser.role).toUpperCase() === 'SUPER_ADMIN' || String(dbUser.role).toUpperCase() === 'ADMIN') {
                    return true;
                }
                const dbPerms = dbUser.permissions || {};
                if (dbUser.canAccessMarketing === true || dbPerms.marketing === true || dbPerms.modules?.OPERACOES_MARKETING === true) {
                    req.user.canAccessMarketing = true;
                    return true;
                }
            }
        }
        throw new common_1.ForbiddenException('Acesso restrito: Seu usuário não possui autorização para operar o módulo de Marketing e Agência. Solicite a liberação ao administrador.');
    }
};
exports.MarketingModuleGuard = MarketingModuleGuard;
exports.MarketingModuleGuard = MarketingModuleGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MarketingModuleGuard);
//# sourceMappingURL=marketing-module.guard.js.map