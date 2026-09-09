import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    // Mock para desenvolvimento local
    if (authHeader === 'Bearer mock-jwt-token-tenant-1') {
      request.user = { userId: 'mock-user', tenantId: 'tenant_123' };
      return true;
    }
    
    return super.canActivate(context);
  }
}
