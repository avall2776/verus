import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Acesso negado: Usuário não autenticado.',
      });
    }

    const isSuperAdmin = Boolean(
      user.isSuperAdmin === true ||
      String(user.role).toUpperCase() === 'SUPER_ADMIN' ||
      String(user.role).toUpperCase() === 'SUPERADMIN'
    );

    if (isSuperAdmin) {
      return true;
    }

    const tenantId = user.tenantId;
    if (!tenantId) {
      throw new UnauthorizedException({
        code: 'TENANT_REQUIRED',
        message: 'Acesso negado: Contexto de empresa ausente.',
      });
    }

    // Valida status ativo do tenant em tempo real
    let isTenantActive = user.tenant?.isActive;
    if (isTenantActive === undefined) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, name: true, isActive: true },
      });

      if (!tenant) {
        throw new UnauthorizedException({
          code: 'TENANT_NOT_FOUND',
          message: 'Empresa não encontrada no sistema.',
        });
      }

      isTenantActive = tenant.isActive;
    }

    if (!isTenantActive) {
      throw new UnauthorizedException({
        code: 'TENANT_BLOCKED',
        message: 'Acesso suspenso: sua empresa está bloqueada pela administração do VERSUS.',
      });
    }

    return true;
  }
}
