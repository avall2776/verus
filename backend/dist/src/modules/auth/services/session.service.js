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
var SessionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/database/prisma.service");
const client_telemetry_util_1 = require("../utils/client-telemetry.util");
const crypto = require("crypto");
const jwt_strategy_1 = require("../jwt.strategy");
let SessionService = SessionService_1 = class SessionService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SessionService_1.name);
    }
    async createSession(params) {
        try {
            const incomingIsMobile = (0, client_telemetry_util_1.isMobilePlatform)(params.telemetry.userAgent, params.telemetry.device);
            const incomingPlatform = incomingIsMobile ? 'MOBILE' : 'WEB';
            const existingSessions = await this.prisma.activeSession.findMany({
                where: {
                    userId: params.userId,
                    isRevoked: false,
                },
            });
            for (const s of existingSessions) {
                const sIsMobile = (0, client_telemetry_util_1.isMobilePlatform)(s.userAgent || '', s.device || '');
                const sPlatform = sIsMobile ? 'MOBILE' : 'WEB';
                if (sPlatform === incomingPlatform) {
                    await this.prisma.activeSession.update({
                        where: { id: s.id },
                        data: {
                            isRevoked: true,
                            revokedAt: new Date(),
                        },
                    });
                    this.logger.log(`[HYBRID_SESSION_ENFORCED] Sessão ${s.id} (${sPlatform}) do usuário ${params.userId} revogada devido a novo login na plataforma ${incomingPlatform}.`);
                }
            }
            (0, jwt_strategy_1.clearUserSessionCache)();
            return await this.prisma.activeSession.create({
                data: {
                    userId: params.userId,
                    tenantId: params.tenantId,
                    sessionToken: params.sessionToken,
                    ipAddress: params.telemetry.ip,
                    city: params.telemetry.city,
                    state: params.telemetry.state,
                    country: params.telemetry.country || 'BR',
                    device: params.telemetry.device,
                    browser: params.telemetry.browser,
                    userAgent: params.telemetry.userAgent,
                    isTrustedDevice: Boolean(params.isTrustedDevice),
                    trustedUntil: params.trustedUntil,
                    lastActiveAt: new Date(),
                },
            });
        }
        catch (err) {
            this.logger.error(`[SESSION_CREATE_ERROR] Falha ao registrar sessão: ${err.message}`);
            return null;
        }
    }
    async recordLoginAudit(params) {
        try {
            return await this.prisma.loginAuditLog.create({
                data: {
                    userId: params.userId,
                    tenantId: params.tenantId,
                    email: params.email.toLowerCase(),
                    userName: params.userName,
                    tenantName: params.tenantName,
                    status: params.status,
                    failReason: params.failReason,
                    ipAddress: params.telemetry.ip,
                    city: params.telemetry.city,
                    state: params.telemetry.state,
                    country: params.telemetry.country || 'BR',
                    device: params.telemetry.device,
                    browser: params.telemetry.browser,
                    userAgent: params.telemetry.userAgent,
                },
            });
        }
        catch (err) {
            this.logger.error(`[AUDIT_LOG_ERROR] Falha ao salvar log de auditoria: ${err.message}`);
            return null;
        }
    }
    async listActiveSessions(tenantId) {
        const where = {
            isRevoked: false,
        };
        if (tenantId && tenantId !== 'ALL') {
            where.tenantId = tenantId;
        }
        const sessions = await this.prisma.activeSession.findMany({
            where,
            orderBy: { lastActiveAt: 'desc' },
            take: 100,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        isSuperAdmin: true,
                        avatarUrl: true,
                        lockedUntil: true,
                        failedLoginAttempts: true,
                    },
                },
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        logoUrl: true,
                    },
                },
            },
        });
        return sessions;
    }
    async listAuditLogs(tenantId) {
        const where = {};
        if (tenantId && tenantId !== 'ALL') {
            where.tenantId = tenantId;
        }
        return this.prisma.loginAuditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
    async killSession(sessionId) {
        const session = await this.prisma.activeSession.findUnique({
            where: { id: sessionId },
        });
        if (!session) {
            throw new common_1.NotFoundException('Sessão não encontrada.');
        }
        const updated = await this.prisma.activeSession.update({
            where: { id: sessionId },
            data: {
                isRevoked: true,
                revokedAt: new Date(),
            },
        });
        this.logger.log(`[KILL_SESSION] Sessão ${sessionId} do usuário ${session.userId} encerrada.`);
        return {
            success: true,
            sessionId,
            userId: session.userId,
            revokedAt: updated.revokedAt,
        };
    }
    async killAllSessions(exceptToken) {
        const where = { isRevoked: false };
        if (exceptToken) {
            where.sessionToken = { not: exceptToken };
        }
        const updated = await this.prisma.activeSession.updateMany({
            where,
            data: {
                isRevoked: true,
                revokedAt: new Date(),
            },
        });
        await this.prisma.user.updateMany({
            data: {
                twoFactorEnabled: true,
                twoFactorMethod: 'WHATSAPP',
                twoFactorPhone: '555491109159',
                trustedDevices: [],
            },
        });
        (0, jwt_strategy_1.clearUserSessionCache)();
        this.logger.log(`[KILL_ALL_SESSIONS] ${updated.count} sessões ativas foram encerradas. 2FA Master ativado globalmente.`);
        return {
            success: true,
            revokedCount: updated.count,
            message: `Todas as conexões ativas foram encerradas com sucesso. Acesso bloqueado para todos os dispositivos até nova validação 2FA via WhatsApp Master.`,
        };
    }
    async unlockUser(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuário não encontrado.');
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
            },
        });
        this.logger.log(`[UNLOCK_USER] Usuário ${user.email} desbloqueado pelo SuperAdmin.`);
        return {
            success: true,
            message: `Usuário ${user.name} (${user.email}) desbloqueado com sucesso.`,
        };
    }
    async isDeviceTrusted(userId, trustedDeviceToken) {
        if (!trustedDeviceToken)
            return false;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { trustedDevices: true },
        });
        if (!user || !user.trustedDevices || !Array.isArray(user.trustedDevices)) {
            return false;
        }
        const match = user.trustedDevices.find((d) => d.token === trustedDeviceToken);
        return Boolean(match);
    }
    async generateTrustedDeviceToken(userId, telemetry) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000);
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { trustedDevices: true },
        });
        const currentDevices = Array.isArray(user?.trustedDevices) ? user.trustedDevices : [];
        const validExisting = currentDevices.slice(-19);
        validExisting.push({
            token,
            device: telemetry.device,
            browser: telemetry.browser,
            ip: telemetry.ip,
            city: telemetry.city,
            state: telemetry.state,
            createdAt: new Date().toISOString(),
            expiresAt: expiresAt.toISOString(),
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                trustedDevices: validExisting,
            },
        });
        return { token, expiresAt };
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = SessionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SessionService);
//# sourceMappingURL=session.service.js.map