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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async login(email, pass, targetTenantId) {
        const cleanEmail = email?.trim().toLowerCase();
        const users = await this.prisma.user.findMany({
            where: { email: { equals: cleanEmail, mode: 'insensitive' } },
            include: {
                tenant: {
                    select: { id: true, name: true, isActive: true, logoUrl: true },
                },
            },
        });
        if (!users || users.length === 0) {
            throw new common_1.UnauthorizedException('E-mail ou senha incorretos.');
        }
        const validUsers = [];
        for (const u of users) {
            const isMatch = await bcrypt.compare(pass, u.password);
            if (isMatch) {
                validUsers.push(u);
            }
        }
        if (validUsers.length === 0) {
            throw new common_1.UnauthorizedException('E-mail ou senha incorretos.');
        }
        if (validUsers.length > 1 && !targetTenantId) {
            return {
                requiresTenantSelection: true,
                user: {
                    name: validUsers[0].name,
                    email: validUsers[0].email,
                },
                tenants: validUsers.map((u) => ({
                    tenantId: u.tenantId,
                    tenantName: u.tenant?.name || 'Empresa',
                    tenantLogo: u.tenant?.logoUrl || null,
                    role: u.role,
                    isActive: u.tenant?.isActive !== false,
                })),
            };
        }
        const user = targetTenantId
            ? validUsers.find((u) => u.tenantId === targetTenantId) || validUsers[0]
            : validUsers[0];
        const isSuperAdmin = Boolean(user.isSuperAdmin || user.role === 'SUPER_ADMIN');
        if (!isSuperAdmin && user.tenant && !user.tenant.isActive) {
            throw new common_1.UnauthorizedException('O acesso desta empresa está suspenso temporariamente pela administração.');
        }
        const payload = {
            sub: user.id,
            tenantId: user.tenantId,
            role: user.role,
            isSuperAdmin,
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isSuperAdmin,
                permissions: user.permissions,
                avatarUrl: user.avatarUrl,
                tenantId: user.tenantId,
                tenantName: user.tenant?.name,
                availableTenants: validUsers.length > 1
                    ? validUsers.map((u) => ({
                        tenantId: u.tenantId,
                        tenantName: u.tenant?.name || 'Empresa',
                        tenantLogo: u.tenant?.logoUrl || null,
                        role: u.role,
                    }))
                    : undefined,
            },
        };
    }
    async switchTenant(userId, targetTenantId) {
        const currentUser = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!currentUser) {
            throw new common_1.UnauthorizedException('Sessão inválida.');
        }
        const targetUser = await this.prisma.user.findFirst({
            where: {
                tenantId: targetTenantId,
                email: { equals: currentUser.email, mode: 'insensitive' },
            },
            include: {
                tenant: {
                    select: { id: true, name: true, isActive: true, logoUrl: true },
                },
            },
        });
        if (!targetUser) {
            throw new common_1.UnauthorizedException('Você não possui acesso registrado a esta empresa.');
        }
        if (!targetUser.isSuperAdmin && targetUser.tenant && !targetUser.tenant.isActive) {
            throw new common_1.UnauthorizedException('O acesso desta empresa está suspenso temporariamente.');
        }
        const allUserTenants = await this.prisma.user.findMany({
            where: { email: { equals: currentUser.email, mode: 'insensitive' } },
            include: {
                tenant: {
                    select: { id: true, name: true, logoUrl: true },
                },
            },
        });
        const isSuperAdmin = Boolean(targetUser.isSuperAdmin || targetUser.role === 'SUPER_ADMIN');
        const payload = {
            sub: targetUser.id,
            tenantId: targetUser.tenantId,
            role: targetUser.role,
            isSuperAdmin,
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: targetUser.id,
                name: targetUser.name,
                email: targetUser.email,
                role: targetUser.role,
                isSuperAdmin,
                permissions: targetUser.permissions,
                avatarUrl: targetUser.avatarUrl,
                tenantId: targetUser.tenantId,
                tenantName: targetUser.tenant?.name,
                availableTenants: allUserTenants.map((u) => ({
                    tenantId: u.tenantId,
                    tenantName: u.tenant?.name || 'Empresa',
                    tenantLogo: u.tenant?.logoUrl || null,
                    role: u.role,
                })),
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map