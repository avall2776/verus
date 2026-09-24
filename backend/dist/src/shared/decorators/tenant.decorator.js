"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentTenant = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentTenant = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    const isSuperAdmin = Boolean(user?.isSuperAdmin === true ||
        String(user?.role).toUpperCase() === 'SUPER_ADMIN' ||
        String(user?.role).toUpperCase() === 'SUPERADMIN');
    if (isSuperAdmin) {
        const rawTenantId = request.headers['x-target-tenant-id'] ||
            request.headers['x-tenant-id'] ||
            request.query?.tenantId;
        const explicitTenantId = Array.isArray(rawTenantId) ? rawTenantId[0] : rawTenantId;
        if (explicitTenantId && typeof explicitTenantId === 'string' && explicitTenantId.trim()) {
            return explicitTenantId.trim();
        }
        if (user?.tenantId) {
            return user.tenantId;
        }
        return 'tenant_123';
    }
    if (!user || !user.tenantId) {
        throw new common_1.UnauthorizedException('Acesso Negado: Contexto de Tenant Ausente.');
    }
    return user.tenantId;
});
//# sourceMappingURL=tenant.decorator.js.map