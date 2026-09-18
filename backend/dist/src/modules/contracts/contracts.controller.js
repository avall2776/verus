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
exports.ContractsController = void 0;
const common_1 = require("@nestjs/common");
const contracts_service_1 = require("./contracts.service");
const create_contract_dto_1 = require("./dto/create-contract.dto");
const update_contract_status_dto_1 = require("./dto/update-contract-status.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const plan_guard_1 = require("../../shared/guards/plan.guard");
const require_module_decorator_1 = require("../../shared/decorators/require-module.decorator");
const tenant_decorator_1 = require("../../shared/decorators/tenant.decorator");
let ContractsController = class ContractsController {
    constructor(contractsService) {
        this.contractsService = contractsService;
    }
    async findAll(tenantId, search, status) {
        return this.contractsService.findAll(tenantId, search, status);
    }
    async create(tenantId, dto) {
        return this.contractsService.create(tenantId, dto);
    }
    async getPublic(codeOrId) {
        return this.contractsService.findPublicByCodeOrId(codeOrId);
    }
    async signPublic(codeOrId, body, req) {
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const userAgent = req.headers['user-agent'] || 'Web Browser';
        return this.contractsService.signPublic(codeOrId, body || {}, clientIp, userAgent);
    }
    async getPdf(id, res, queryTenantId) {
        const html = await this.contractsService.generatePdfHtml(id, queryTenantId);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
    }
    async getWhatsAppShare(tenantId, id, queryOrigin, req) {
        const origin = queryOrigin || req?.headers?.origin || (req?.headers?.referer ? new URL(req.headers.referer).origin : undefined);
        return this.contractsService.getWhatsAppShare(tenantId, id, origin);
    }
    async findOne(tenantId, id) {
        return this.contractsService.findOne(tenantId, id);
    }
    async updateStatus(tenantId, id, dto, req) {
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const userAgent = req.headers['user-agent'] || 'Web Browser';
        return this.contractsService.updateStatus(tenantId, id, dto, clientIp, userAgent);
    }
    async delete(tenantId, id) {
        return this.contractsService.delete(tenantId, id);
    }
};
exports.ContractsController = ContractsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, plan_guard_1.PlanGuard),
    (0, require_module_decorator_1.RequireModule)('proposalsContracts'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('search')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, plan_guard_1.PlanGuard),
    (0, require_module_decorator_1.RequireModule)('proposalsContracts'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_contract_dto_1.CreateContractDto]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('public/:codeOrId'),
    __param(0, (0, common_1.Param)('codeOrId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "getPublic", null);
__decorate([
    (0, common_1.Post)('public/:codeOrId/sign'),
    __param(0, (0, common_1.Param)('codeOrId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "signPublic", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "getPdf", null);
__decorate([
    (0, common_1.Get)(':id/whatsapp-share'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, plan_guard_1.PlanGuard),
    (0, require_module_decorator_1.RequireModule)('proposalsContracts'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('origin')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "getWhatsAppShare", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, plan_guard_1.PlanGuard),
    (0, require_module_decorator_1.RequireModule)('proposalsContracts'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, plan_guard_1.PlanGuard),
    (0, require_module_decorator_1.RequireModule)('proposalsContracts'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_contract_status_dto_1.UpdateContractStatusDto, Object]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, plan_guard_1.PlanGuard),
    (0, require_module_decorator_1.RequireModule)('proposalsContracts'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "delete", null);
exports.ContractsController = ContractsController = __decorate([
    (0, common_1.Controller)('contracts'),
    __metadata("design:paramtypes", [contracts_service_1.ContractsService])
], ContractsController);
//# sourceMappingURL=contracts.controller.js.map