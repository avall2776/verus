import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user || !user.tenantId) {
      throw new UnauthorizedException('Acesso Negado: Contexto de Tenant Ausente.');
    }
    
    return user.tenantId;
  },
);
