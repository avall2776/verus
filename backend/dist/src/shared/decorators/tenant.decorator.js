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
        const explicitTenantId = request.headers['x-target-tenant-id'] ||
            request.headers['x-tenant-id'] ||
            request.query?.tenantId;
        if (explicitTenantId && typeof explicitTenantId === 'string') {
            return explicitTenantId;
        }
    }
    if (!user || !user.tenantId) {
        throw new common_1.UnauthorizedException('Acesso Negado: Contexto de Tenant Ausente.');
    }
    return user.tenantId;
});
//# sourceMappingURL=tenant.decorator.js.map