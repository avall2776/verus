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
      const rawTenantId = 
        request.headers['x-target-tenant-id'] || 
        request.headers['x-tenant-id'] || 
        request.query?.tenantId;
      
      const explicitTenantId = Array.isArray(rawTenantId) ? rawTenantId[0] : rawTenantId;
      if (explicitTenantId && typeof explicitTenantId === 'string' && explicitTenantId.trim()) {
        return explicitTenantId.trim();
      }

      // Se for Super Admin e não passou header específico, usa o seu tenant padrão ou 'tenant_123'
      if (user?.tenantId) {
        return user.tenantId;
      }
      return 'tenant_123';
    }

    if (!user || !user.tenantId) {
      throw new UnauthorizedException('Acesso Negado: Contexto de Tenant Ausente.');
    }
    
    return user.tenantId;
  },
);
