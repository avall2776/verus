import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { TwoFactorService } from './services/two-factor.service';
import { SessionService } from './services/session.service';
import { ClientTelemetry } from './utils/client-telemetry.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly twoFactorService: TwoFactorService,
    private readonly sessionService: SessionService,
  ) {}

  async login(
    email: string,
    pass: string,
    targetTenantId?: string,
    telemetry?: ClientTelemetry,
    trustedDeviceToken?: string,
  ) {
    const cleanEmail = email?.trim().toLowerCase();
    const clientTelem: ClientTelemetry = telemetry || {
      ip: '127.0.0.1',
      city: 'Ambiente Local',
      state: 'Dev',
      country: 'BR',
      device: 'Computador',
      browser: 'Navegador Web',
      userAgent: '',
    };

    // 1. Localiza todos os usuários vinculados a este e-mail no sistema
    const users = await this.prisma.user.findMany({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } },
      include: {
        tenant: {
          select: { id: true, name: true, isActive: true, logoUrl: true },
        },
        departments: {
          include: {
            department: { select: { id: true, name: true, color: true } },
          },
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
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    // 2. Verifica se a conta está temporariamente bloqueada por múltiplas falhas de senha
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
      throw new UnauthorizedException(
        `Conta bloqueada por excesso de tentativas de senha. Contate o SuperAdmin Master para desbloqueio ou aguarde ${waitMin} minutos.`,
      );
    }

    // 3. Filtra aqueles cuja senha confere
    const validUsers: typeof users = [];
    for (const u of users) {
      const isMatch = await bcrypt.compare(pass, u.password);
      if (isMatch) {
        validUsers.push(u);
      }
    }

    if (validUsers.length === 0) {
      // Incrementa tentativas incorretas
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
        throw new UnauthorizedException(
          'Conta bloqueada preventivamente após 5 tentativas incorretas. Contate o SuperAdmin Master para liberar o acesso.',
        );
      }

      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    // 4. Se a senha conferiu, reseta tentativas de falha
    await this.prisma.user.updateMany({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    // 5. Se houver mais de uma empresa associada e nenhuma foi especificada, solicita seleção
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

    // 6. Seleciona o usuário do tenant desejado (ou o único disponível)
    const user = targetTenantId
      ? validUsers.find((u) => u.tenantId === targetTenantId) || validUsers[0]
      : validUsers[0];

    const isSuperAdmin = Boolean(user.isSuperAdmin || user.role === 'SUPER_ADMIN');

    if (!isSuperAdmin && user.tenant && !user.tenant.isActive) {
      throw new UnauthorizedException('O acesso desta empresa está suspenso temporariamente pela administração.');
    }

    // 7. CHECAGEM DE DUPLO FATOR DE AUTENTICAÇÃO (2FA BANCÁRIO)
    // Inicialmente habilitado para SuperAdmin OU para contas com twoFactorEnabled ativado
    const requires2FA = isSuperAdmin || Boolean(user.twoFactorEnabled);

    if (requires2FA) {
      // Verifica se o dispositivo atual é confiável (lembrado nos últimos 30 dias)
      const isTrusted = await this.sessionService.isDeviceTrusted(user.id, trustedDeviceToken);

      if (!isTrusted) {
        // Dispara código OTP para o WhatsApp Master com identificação da empresa e localização
        const twoFaResult = await this.twoFactorService.generateAndSend2FA(
          {
            id: user.id,
            name: user.name,
            email: user.email,
            tenantId: user.tenantId,
          },
          user.tenant?.name || 'Vallor Plataforma',
          clientTelem,
        );

        await this.sessionService.recordLoginAudit({
          userId: user.id,
          tenantId: user.tenantId,
          email: user.email,
          userName: user.name,
          tenantName: user.tenant?.name,
          status: '2FA_REQUESTED',
          failReason: `Aguardando validação · Código: ${twoFaResult.code}`,
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

    // 8. Se 2FA não for exigido ou o dispositivo já for confiável, conclui login direto
    return this.finalizeSuccessfulLogin(user, users, clientTelem, false);
  }

  /**
   * Valida o código 2FA e conclui o login
   */
  async verify2FALogin(
    tempToken: string,
    code: string,
    rememberDevice: boolean,
    telemetry?: ClientTelemetry,
  ) {
    const clientTelem: ClientTelemetry = telemetry || {
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
        departments: {
          include: {
            department: { select: { id: true, name: true, color: true } },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não localizado após validação.');
    }

    const allUsers = await this.prisma.user.findMany({
      where: { email: { equals: user.email, mode: 'insensitive' } },
      include: {
        tenant: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
    });

    let trustedTokenResult: { token: string; expiresAt: Date } | null = null;
    if (rememberDevice) {
      trustedTokenResult = await this.sessionService.generateTrustedDeviceToken(user.id, clientTelem);
    }

    const loginData = await this.finalizeSuccessfulLogin(
      user,
      allUsers,
      clientTelem,
      Boolean(rememberDevice),
      trustedTokenResult?.expiresAt,
    );

    return {
      ...loginData,
      trustedDeviceToken: trustedTokenResult?.token,
    };
  }

  /**
   * Finaliza sessão com emissão de JWT, registro no banco de sessões ativas e audit log
   */
  private async finalizeSuccessfulLogin(
    user: any,
    allUsersForEmail: any[],
    telemetry: ClientTelemetry,
    isTrustedDevice: boolean,
    trustedUntil?: Date,
  ) {
    const isSuperAdmin = Boolean(user.isSuperAdmin || user.role === 'SUPER_ADMIN');

    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      isSuperAdmin,
    };

    const token = this.jwtService.sign(payload);

    // Registra sessão ativa no banco para monitoramento em tempo real no SuperAdmin
    await this.sessionService.createSession({
      userId: user.id,
      tenantId: user.tenantId,
      sessionToken: token,
      telemetry,
      isTrustedDevice,
      trustedUntil,
    });

    // Registra auditoria de sucesso
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
        departments: Array.isArray(user.departments)
          ? user.departments.map((ud: any) => ({
              id: ud.department?.id || ud.departmentId,
              departmentId: ud.departmentId || ud.department?.id,
              name: ud.department?.name || '',
              color: ud.department?.color || '#3B82F6',
            }))
          : [],
        availableTenants:
          allUsersForEmail.length > 1
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

  /**
   * Retorna o perfil completo e atualizado do usuário logado com departamentos e permissões
   */
  async getProfile(userId: string) {
    if (!userId) {
      throw new UnauthorizedException('Sessão inválida.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: {
          select: { id: true, name: true, isActive: true, logoUrl: true, plan: true },
        },
        departments: {
          include: {
            department: { select: { id: true, name: true, color: true } },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    const isSuperAdmin = Boolean(user.isSuperAdmin || user.role === 'SUPER_ADMIN');

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isSuperAdmin,
      permissions: user.permissions,
      avatarUrl: user.avatarUrl,
      tenantId: user.tenantId,
      tenantName: user.tenant?.name,
      tenant: user.tenant,
      departments: Array.isArray(user.departments)
        ? user.departments.map((ud: any) => ({
            id: ud.department?.id || ud.departmentId,
            departmentId: ud.departmentId || ud.department?.id,
            name: ud.department?.name || '',
            color: ud.department?.color || '#3B82F6',
          }))
        : [],
    };
  }

  /**
   * Alternância imediata de empresa (Tenant Switch) para operadores multi-tenant
   */
  async switchTenant(userId: string, targetTenantId: string, telemetry?: ClientTelemetry) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new UnauthorizedException('Sessão inválida.');
    }

    // Localiza o usuário na empresa de destino com o mesmo e-mail
    const targetUser = await this.prisma.user.findFirst({
      where: {
        tenantId: targetTenantId,
        email: { equals: currentUser.email, mode: 'insensitive' },
      },
      include: {
        tenant: {
          select: { id: true, name: true, isActive: true, logoUrl: true },
        },
        departments: {
          include: {
            department: { select: { id: true, name: true, color: true } },
          },
        },
      },
    });

    if (!targetUser) {
      throw new UnauthorizedException('Você não possui acesso registrado a esta empresa.');
    }

    if (!targetUser.isSuperAdmin && targetUser.tenant && !targetUser.tenant.isActive) {
      throw new UnauthorizedException('O acesso desta empresa está suspenso temporariamente.');
    }

    // Localiza todas as empresas disponíveis para este e-mail
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
        departments: Array.isArray((targetUser as any).departments)
          ? (targetUser as any).departments.map((ud: any) => ({
              id: ud.department?.id || ud.departmentId,
              departmentId: ud.departmentId || ud.department?.id,
              name: ud.department?.name || '',
              color: ud.department?.color || '#3B82F6',
            }))
          : [],
        availableTenants: allUserTenants.map((u) => ({
          tenantId: u.tenantId,
          tenantName: u.tenant?.name || 'Empresa',
          tenantLogo: u.tenant?.logoUrl || null,
          role: u.role,
        })),
      },
    };
  }
}
