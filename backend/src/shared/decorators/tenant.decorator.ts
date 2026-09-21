import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    // Se o usuário autenticado for SUPER_ADMIN, permite selecionar um tenant alvo para governança
    const isSuperAdmin = Boolean(
      user?.isSuperAdmin === true ||
      String(user?.role).toUpperCase() === 'SUPER_ADMIN' ||
      String(user?.role).toUpperCase() === 'SUPERADMIN'
    );
    if (isSuperAdmin) {
      const explicitTenantId = 
        request.headers['x-target-tenant-id'] || 
        request.headers['x-tenant-id'] || 
        request.query?.tenantId;
      if (explicitTenantId && typeof explicitTenantId === 'string') {
        return explicitTenantId;
      }
    }

    if (!user || !user.tenantId) {
      throw new UnauthorizedException('Acesso Negado: Contexto de Tenant Ausente.');
    }
    
    return user.tenantId;
  },
);
