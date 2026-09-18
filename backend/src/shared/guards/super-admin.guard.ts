import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('Acesso restrito exclusivamente ao Super Administrador.');
    }

    const userRole = String(user.role || '').toUpperCase();
    const isSuperAdmin = Boolean(
      user.isSuperAdmin === true || 
      userRole === 'SUPER_ADMIN' || 
      userRole === 'SUPERADMIN'
    );

    if (isSuperAdmin) {
      return true;
    }

    // Fallback de segurança contra tokens dessincronizados
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

    throw new ForbiddenException('Acesso restrito exclusivamente ao Super Administrador.');
  }
}
