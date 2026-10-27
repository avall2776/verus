import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, pass: string, targetTenantId?: string) {
    const cleanEmail = email?.trim().toLowerCase();

    // 1. Localiza todos os usuários vinculados a este e-mail no sistema
    const users = await this.prisma.user.findMany({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } },
      include: {
        tenant: {
          select: { id: true, name: true, isActive: true, logoUrl: true },
        },
      },
    });

    if (!users || users.length === 0) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    // 2. Filtra aqueles cuja senha confere
    const validUsers: typeof users = [];
    for (const u of users) {
      const isMatch = await bcrypt.compare(pass, u.password);
      if (isMatch) {
        validUsers.push(u);
      }
    }

    if (validUsers.length === 0) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    // 3. Se houver mais de uma empresa associada e nenhuma foi especificada, solicita seleção
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

    // 4. Seleciona o usuário do tenant desejado (ou o único disponível)
    const user = targetTenantId
      ? validUsers.find((u) => u.tenantId === targetTenantId) || validUsers[0]
      : validUsers[0];

    const isSuperAdmin = Boolean(user.isSuperAdmin || user.role === 'SUPER_ADMIN');

    if (!isSuperAdmin && user.tenant && !user.tenant.isActive) {
      throw new UnauthorizedException('O acesso desta empresa está suspenso temporariamente pela administração.');
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

  /**
   * Alternância imediata de empresa (Tenant Switch) para operadores multi-tenant
   */
  async switchTenant(userId: string, targetTenantId: string) {
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
}
