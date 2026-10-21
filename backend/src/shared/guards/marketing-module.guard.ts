import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class MarketingModuleGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Acesso negado: Usuário não autenticado.');
    }

    const role = String(user.role || '').toUpperCase();
    const isSuperAdmin = Boolean(
      user.isSuperAdmin === true ||
      role === 'SUPER_ADMIN' ||
      role === 'SUPERADMIN'
    );

    if (isSuperAdmin) {
      return true;
    }

    // Administradores da empresa possuem acesso por padrão
    if (role === 'ADMIN') {
      return true;
    }

    // Verificação nos dados de sessão / JWT
    if (user.canAccessMarketing === true) {
      return true;
    }

    const perms = (user.permissions as any) || {};
    if (perms.marketing === true || perms.modules?.OPERACOES_MARKETING === true) {
      return true;
    }

    // Consulta de resiliência e fallback no banco de dados
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

        const dbPerms = (dbUser.permissions as any) || {};
        if (dbUser.canAccessMarketing === true || dbPerms.marketing === true || dbPerms.modules?.OPERACOES_MARKETING === true) {
          req.user.canAccessMarketing = true;
          return true;
        }
      }
    }

    throw new ForbiddenException(
      'Acesso restrito: Seu usuário não possui autorização para operar o módulo de Marketing e Agência. Solicite a liberação ao administrador.'
    );
  }
}
