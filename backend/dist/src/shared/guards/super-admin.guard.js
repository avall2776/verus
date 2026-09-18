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
exports.SuperAdminGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let SuperAdminGuard = class SuperAdminGuard {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const user = req.user;
        if (!user) {
            throw new common_1.ForbiddenException('Acesso restrito exclusivamente ao Super Administrador.');
        }
        const userRole = String(user.role || '').toUpperCase();
        const isSuperAdmin = Boolean(user.isSuperAdmin === true ||
            userRole === 'SUPER_ADMIN' ||
            userRole === 'SUPERADMIN');
        if (isSuperAdmin) {
            return true;
        }
        const userId = user.userId || user.id;
        if (userId) {
            const dbUser = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, role: true, isSuperAdmin: true },
            });
            if (dbUser && (dbUser.isSuperAdmin || String(dbUser.role).toUpperCase() === 'SUPER_ADMIN')) {
                req.user.isSuperAdmin = true;
                req.user.role = 'SUPER_ADMIN';
                return true;
            }
        }
        throw new common_1.ForbiddenException('Acesso restrito exclusivamente ao Super Administrador.');
    }
};
exports.SuperAdminGuard = SuperAdminGuard;
exports.SuperAdminGuard = SuperAdminGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SuperAdminGuard);
//# sourceMappingURL=super-admin.guard.js.map