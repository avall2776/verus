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
const two_factor_service_1 = require("./services/two-factor.service");
const session_service_1 = require("./services/session.service");
let AuthService = class AuthService {
    constructor(prisma, jwtService, twoFactorService, sessionService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.twoFactorService = twoFactorService;
        this.sessionService = sessionService;
    }
    async login(email, pass, targetTenantId, telemetry, trustedDeviceToken) {
        const cleanEmail = email?.trim().toLowerCase();
        const clientTelem = telemetry || {
            ip: '127.0.0.1',
            city: 'Ambiente Local',
            state: 'Dev',
            country: 'BR',
            device: 'Computador',
            browser: 'Navegador Web',
            userAgent: '',
        };
        const users = await this.prisma.user.findMany({
            where: { email: { equals: cleanEmail, mode: 'insensitive' } },
            include: {
                tenant: {
                    select: { id: true, name: true, isActive: true, logoUrl: true },
                },
            },
        });
        if (!users || users.length === 0) {
            await this.sessionService.recordLoginAudit({
                email: cleanEmail,
                status: 'FAILED_PASSWORD',
                failReason: 'Conta inexistente',
                telemetry: clientTelem,
            });
            throw new common_1.UnauthorizedException('E-mail ou senha incorretos.');
        }
        const primaryUser = users[0];
        if (primaryUser.lockedUntil && new Date() < primaryUser.lockedUntil) {
            const waitMin = Math.ceil((new Date(primaryUser.lockedUntil).getTime() - Date.now()) / (60 * 1000));
            await this.sessionService.recordLoginAudit({
                userId: primaryUser.id,
                tenantId: primaryUser.tenantId,
                email: cleanEmail,
                userName: primaryUser.name,
                tenantName: primaryUser.tenant?.name,
                status: 'ACCOUNT_LOCKED',
                failReason: `Conta bloqueada. Restam ${waitMin} minutos.`,
                telemetry: clientTelem,
            });
            throw new common_1.UnauthorizedException(`Conta bloqueada por excesso de tentativas de senha. Contate o SuperAdmin Master para desbloqueio ou aguarde ${waitMin} minutos.`);
        }
        const validUsers = [];
        for (const u of users) {
            const isMatch = await bcrypt.compare(pass, u.password);
            if (isMatch) {
                validUsers.push(u);
            }
        }
        if (validUsers.length === 0) {
            const newAttempts = (primaryUser.failedLoginAttempts || 0) + 1;
            const willLock = newAttempts >= 5;
            const lockedUntil = willLock ? new Date(Date.now() + 15 * 60 * 1000) : null;
            await this.prisma.user.updateMany({
                where: { email: { equals: cleanEmail, mode: 'insensitive' } },
                data: {
                    failedLoginAttempts: newAttempts,
                    ...(willLock ? { lockedUntil } : {}),
                },
            });
            await this.sessionService.recordLoginAudit({
                userId: primaryUser.id,
                tenantId: primaryUser.tenantId,
                email: cleanEmail,
                userName: primaryUser.name,
                tenantName: primaryUser.tenant?.name,
                status: willLock ? 'ACCOUNT_LOCKED' : 'FAILED_PASSWORD',
                failReason: willLock ? 'Bloqueio preventivo após 5 falhas' : `Senha incorreta (tentativa ${newAttempts})`,
                telemetry: clientTelem,
            });
            if (willLock) {
                throw new common_1.UnauthorizedException('Conta bloqueada preventivamente após 5 tentativas incorretas. Contate o SuperAdmin Master para liberar o acesso.');
            }
            throw new common_1.UnauthorizedException('E-mail ou senha incorretos.');
        }
        await this.prisma.user.updateMany({
            where: { email: { equals: cleanEmail, mode: 'insensitive' } },
            data: { failedLoginAttempts: 0, lockedUntil: null },
        });
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
        const requires2FA = isSuperAdmin || Boolean(user.twoFactorEnabled);
        if (requires2FA) {
            const isTrusted = await this.sessionService.isDeviceTrusted(user.id, trustedDeviceToken);
            if (!isTrusted) {
                const twoFaResult = await this.twoFactorService.generateAndSend2FA({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    tenantId: user.tenantId,
                }, user.tenant?.name || 'Vallor Plataforma', clientTelem);
                await this.sessionService.recordLoginAudit({
                    userId: user.id,
                    tenantId: user.tenantId,
                    email: user.email,
                    userName: user.name,
                    tenantName: user.tenant?.name,
                    status: '2FA_REQUESTED',
                    failReason: 'Aguardando validação de 6 dígitos no WhatsApp Master',
                    telemetry: clientTelem,
                });
                return {
                    requires2FA: true,
                    tempToken: twoFaResult.tempToken,
                    maskedPhone: twoFaResult.maskedPhone,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        tenantId: user.tenantId,
                        tenantName: user.tenant?.name,
                    },
                };
            }
        }
        return this.finalizeSuccessfulLogin(user, users, clientTelem, false);
    }
    async verify2FALogin(tempToken, code, rememberDevice, telemetry) {
        const clientTelem = telemetry || {
            ip: '127.0.0.1',
            city: 'Ambiente Local',
            state: 'Dev',
            country: 'BR',
            device: 'Computador',
            browser: 'Navegador Web',
            userAgent: '',
        };
        const verified = await this.twoFactorService.verify2FACode(tempToken, code);
        const user = await this.prisma.user.findUnique({
            where: { id: verified.userId },
            include: {
                tenant: {
                    select: { id: true, name: true, isActive: true, logoUrl: true },
                },
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Usuário não localizado após validação.');
        }
        const allUsers = await this.prisma.user.findMany({
            where: { email: { equals: user.email, mode: 'insensitive' } },
            include: {
                tenant: {
                    select: { id: true, name: true, logoUrl: true },
                },
            },
        });
        let trustedTokenResult = null;
        if (rememberDevice) {
            trustedTokenResult = await this.sessionService.generateTrustedDeviceToken(user.id, clientTelem);
        }
        const loginData = await this.finalizeSuccessfulLogin(user, allUsers, clientTelem, Boolean(rememberDevice), trustedTokenResult?.expiresAt);
        return {
            ...loginData,
            trustedDeviceToken: trustedTokenResult?.token,
        };
    }
    async finalizeSuccessfulLogin(user, allUsersForEmail, telemetry, isTrustedDevice, trustedUntil) {
        const isSuperAdmin = Boolean(user.isSuperAdmin || user.role === 'SUPER_ADMIN');
        const payload = {
            sub: user.id,
            tenantId: user.tenantId,
            role: user.role,
            isSuperAdmin,
        };
        const token = this.jwtService.sign(payload);
        await this.sessionService.createSession({
            userId: user.id,
            tenantId: user.tenantId,
            sessionToken: token,
            telemetry,
            isTrustedDevice,
            trustedUntil,
        });
        await this.sessionService.recordLoginAudit({
            userId: user.id,
            tenantId: user.tenantId,
            email: user.email,
            userName: user.name,
            tenantName: user.tenant?.name,
            status: 'SUCCESS',
            telemetry,
        });
        return {
            access_token: token,
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
                availableTenants: allUsersForEmail.length > 1
                    ? allUsersForEmail.map((u) => ({
                        tenantId: u.tenantId,
                        tenantName: u.tenant?.name || 'Empresa',
                        tenantLogo: u.tenant?.logoUrl || null,
                        role: u.role,
                    }))
                    : undefined,
            },
        };
    }
    async switchTenant(userId, targetTenantId, telemetry) {
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
        const token = this.jwtService.sign(payload);
        if (telemetry) {
            await this.sessionService.createSession({
                userId: targetUser.id,
                tenantId: targetUser.tenantId,
                sessionToken: token,
                telemetry,
            });
        }
        return {
            access_token: token,
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
        jwt_1.JwtService,
        two_factor_service_1.TwoFactorService,
        session_service_1.SessionService])
], AuthService);
//# sourceMappingURL=auth.service.js.map