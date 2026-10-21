"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiTokensController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const tenant_decorator_1 = require("../../shared/decorators/tenant.decorator");
const api_tokens_service_1 = require("./api-tokens.service");
let ApiTokensController = class ApiTokensController {
    constructor(apiTokensService) {
        this.apiTokensService = apiTokensService;
    }
    async listTokens(tenantId) {
        return this.apiTokensService.listTokens(tenantId);
    }
    async createToken(tenantId, body, req) {
        const createdBy = req.user?.name || req.user?.email || 'Administrador';
        return this.apiTokensService.createToken(tenantId, body.name, body.permissions, createdBy);
    }
    async toggleToken(tenantId, id) {
        return this.apiTokensService.toggleToken(tenantId, id);
    }
    async deleteToken(tenantId, id) {
        return this.apiTokensService.deleteToken(tenantId, id);
    }
};
exports.ApiTokensController = ApiTokensController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ApiTokensController.prototype, "listTokens", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ApiTokensController.prototype, "createToken", null);
__decorate([
    (0, common_1.Patch)(':id/toggle'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ApiTokensController.prototype, "toggleToken", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ApiTokensController.prototype, "deleteToken", null);
exports.ApiTokensController = ApiTokensController = __decorate([
    (0, common_1.Controller)('api/v1/api-tokens'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [api_tokens_service_1.ApiTokensService])
], ApiTokensController);
//# sourceMappingURL=api-tokens.controller.js.map