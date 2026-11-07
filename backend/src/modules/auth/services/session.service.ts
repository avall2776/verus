import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { ClientTelemetry } from '../utils/client-telemetry.util';
import * as crypto from 'crypto';
import { clearUserSessionCache } from '../jwt.strategy';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra uma nova sessão ativa após login bem-sucedido
   */
  async createSession(params: {
    userId: string;
    tenantId: string;
    sessionToken: string;
    telemetry: ClientTelemetry;
    isTrustedDevice?: boolean;
    trustedUntil?: Date;
  }) {
    try {
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
    } catch (err: any) {
      this.logger.error(`[SESSION_CREATE_ERROR] Falha ao registrar sessão: ${err.message}`);
      return null;
    }
  }

  /**
   * Registra log de auditoria de tentativa de acesso (SOC / Compliance)
   */
  async recordLoginAudit(params: {
    userId?: string;
    tenantId?: string;
    email: string;
    userName?: string;
    tenantName?: string;
    status: 'SUCCESS' | 'FAILED_PASSWORD' | 'FAILED_2FA' | 'ACCOUNT_LOCKED' | '2FA_REQUESTED';
    failReason?: string;
    telemetry: ClientTelemetry;
  }) {
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
    } catch (err: any) {
      this.logger.error(`[AUDIT_LOG_ERROR] Falha ao salvar log de auditoria: ${err.message}`);
      return null;
    }
  }

  /**
   * Lista todas as sessões ativas com filtros multi-tenant
   */
  async listActiveSessions(tenantId?: string) {
    const where: any = {
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

  /**
   * Lista logs de auditoria recentes (últimas 100 tentativas de login)
   */
  async listAuditLogs(tenantId?: string) {
    const where: any = {};
    if (tenantId && tenantId !== 'ALL') {
      where.tenantId = tenantId;
    }

    return this.prisma.loginAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Derrubada remota de sessão (Kill Session)
   */
  async killSession(sessionId: string) {
    const session = await this.prisma.activeSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada.');
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

  /**
   * Encerra todas as sessões ativas globalmente e enforça 2FA para todos os usuários
   */
  async killAllSessions(exceptToken?: string) {
    const where: any = { isRevoked: false };
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

    // Enforça 2FA WhatsApp Master para todos os usuários do sistema
    await this.prisma.user.updateMany({
      data: {
        twoFactorEnabled: true,
        twoFactorMethod: 'WHATSAPP',
        twoFactorPhone: '555491109159',
        trustedDevices: [],
      },
    });

    // Limpa cache em memória de autenticação
    clearUserSessionCache();

    this.logger.log(`[KILL_ALL_SESSIONS] ${updated.count} sessões ativas foram encerradas. 2FA Master ativado globalmente.`);
    return {
      success: true,
      revokedCount: updated.count,
      message: `Todas as conexões ativas foram encerradas com sucesso. Acesso bloqueado para todos os dispositivos até nova validação 2FA via WhatsApp Master.`,
    };
  }

  /**
   * Desbloqueia conta travada por erro de senha
   */
  async unlockUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
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

  /**
   * Valida se um token de dispositivo confiável é válido
   */
  async isDeviceTrusted(userId: string, trustedDeviceToken?: string): Promise<boolean> {
    if (!trustedDeviceToken) return false;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { trustedDevices: true },
    });

    if (!user || !user.trustedDevices || !Array.isArray(user.trustedDevices)) {
      return false;
    }

    const match = (user.trustedDevices as any[]).find(
      (d) => d.token === trustedDeviceToken,
    );

    return Boolean(match);
  }

  /**
   * Registra o dispositivo como confiável permanentemente
   */
  async generateTrustedDeviceToken(userId: string, telemetry: ClientTelemetry): Promise<{ token: string; expiresAt: Date }> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000); // Confiável permanentemente (10 anos)

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { trustedDevices: true },
    });

    const currentDevices = Array.isArray(user?.trustedDevices) ? (user.trustedDevices as any[]) : [];
    const validExisting = currentDevices.slice(-19); // Mantém os últimos 20 dispositivos confiáveis

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
}

