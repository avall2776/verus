"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentTenant = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentTenant = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.tenantId) {
        throw new common_1.UnauthorizedException('Acesso Negado: Contexto de Tenant Ausente.');
    }
    return user.tenantId;
});
//# sourceMappingURL=tenant.decorator.js.map