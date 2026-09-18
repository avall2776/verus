import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        ExtractJwt.fromUrlQueryParameter('token'),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-key-change-me',
    });
  }

  async validate(payload: any) {
    const userId = payload?.sub || payload?.id || payload?.userId;

    if (!userId) {
      throw new UnauthorizedException({
        code: 'INVALID_TOKEN',
        message: 'Token inválido: identificador de usuário ausente.',
      });
    }

    // Consulta em tempo real no banco de dados para garantir governança instantânea
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isSuperAdmin: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            name: true,
            isActive: true,
            planId: true,
            plan: {
              select: {
                id: true,
                name: true,
                price: true,
                hasCRM: true,
                hasWhatsApp: true,
                hasInstagram: true,
                hasAIAgent: true,
                maxUsers: true,
                maxAIMsgs: true,
                maxWorkspaces: true,
                modules: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      // Fallback para tabela dedicada SuperAdmin caso o login tenha vindo dela
      const sa = await this.prisma.superAdmin.findUnique({ where: { id: userId } });
      if (sa) {
        return {
          id: sa.id,
          userId: sa.id,
          email: sa.email,
          role: 'SUPER_ADMIN',
          isSuperAdmin: true,
          tenantId: null,
          tenant: null,
          plan: null,
        };
      }

      throw new UnauthorizedException({
        code: 'USER_NOT_FOUND',
        message: 'Token inválido: Usuário não encontrado no sistema.',
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException({
        code: 'USER_INACTIVE',
        message: 'Sua conta de usuário foi desativada pelo administrador.',
      });
    }

    const isSuperAdmin = Boolean(
      user.isSuperAdmin === true ||
      String(user.role).toUpperCase() === 'SUPER_ADMIN' ||
      String(user.role).toUpperCase() === 'SUPERADMIN'
    );

    // Validação rígida e em tempo real do bloqueio de Tenant
    if (!isSuperAdmin) {
      if (!user.tenant) {
        throw new UnauthorizedException({
          code: 'TENANT_NOT_FOUND',
          message: 'Acesso negado: Nenhuma empresa vinculada a este usuário.',
        });
      }

      if (!user.tenant.isActive) {
        throw new UnauthorizedException({
          code: 'TENANT_BLOCKED',
          message: `O acesso da empresa '${user.tenant.name}' está suspenso pela administração do VERSUS. Acesso bloqueado.`,
        });
      }
    }

    return {
      id: user.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isSuperAdmin,
      tenantId: user.tenantId,
      tenant: user.tenant,
      plan: user.tenant?.plan || null,
    };
  }
}
