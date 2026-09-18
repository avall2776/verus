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
exports.ProposalsController = void 0;
const common_1 = require("@nestjs/common");
const proposals_service_1 = require("./proposals.service");
const create_proposal_dto_1 = require("./dto/create-proposal.dto");
const update_proposal_dto_1 = require("./dto/update-proposal.dto");
const update_proposal_status_dto_1 = require("./dto/update-proposal-status.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const plan_guard_1 = require("../../shared/guards/plan.guard");
const require_module_decorator_1 = require("../../shared/decorators/require-module.decorator");
const tenant_decorator_1 = require("../../shared/decorators/tenant.decorator");
let ProposalsController = class ProposalsController {
    constructor(proposalsService) {
        this.proposalsService = proposalsService;
    }
    async findAll(tenantId, status) {
        return this.proposalsService.findAll(tenantId, status);
    }
    async create(tenantId, dto) {
        return this.proposalsService.create(tenantId, dto);
    }
    async getCompanyProfile(tenantId) {
        return this.proposalsService.getCompanyProfile(tenantId);
    }
    async updateCompanyProfile(tenantId, body) {
        return this.proposalsService.updateCompanyProfile(tenantId, body);
    }
    async findOne(tenantId, id) {
        return this.proposalsService.findOne(tenantId, id);
    }
    async update(tenantId, id, dto) {
        return this.proposalsService.update(tenantId, id, dto);
    }
    async patch(tenantId, id, dto) {
        return this.proposalsService.update(tenantId, id, dto);
    }
    async updateStatus(tenantId, id, dto) {
        return this.proposalsService.updateStatus(tenantId, id, dto);
    }
    async getPublic(codeOrId) {
        return this.proposalsService.findPublicByCodeOrId(codeOrId);
    }
    async acceptPublic(codeOrId) {
        return this.proposalsService.acceptPublic(codeOrId);
    }
    async getWhatsAppShare(tenantId, id, queryOrigin, req) {
        const origin = queryOrigin || req?.headers?.origin || (req?.headers?.referer ? new URL(req.headers.referer).origin : undefined);
        return this.proposalsService.getWhatsAppShare(tenantId, id, origin);
    }
    async getPdf(id, res, queryTenantId) {
        const html = await this.proposalsService.generatePdfHtml(id, queryTenantId);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
    }
    async delete(tenantId, id) {
        return this.proposalsService.delete(tenantId, id);
    }
};
exports.ProposalsController = ProposalsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, plan_guard_1.PlanGuard),
    (0, require_module_decorator_1.RequireModule)('proposalsContracts'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProposalsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, plan_guard_1.PlanGuard),
    (0, require_module_decorator_1.RequireModule)('proposalsContracts'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_proposal_dto_1.CreateProposalDto]),
    __metadata("design:returntype", Promise)
], ProposalsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('company-profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, plan_guard_1.PlanGuard),
    (0, require_module_decorator_1.RequireModule)('proposalsContracts'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProposalsController.prototype, "getCompanyProfile", null);
__decorate([
    (0, common_1.Patch)('company-profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, plan_guard_1.PlanGuard),
    (0, require_module_decorator_1.RequireModule)('proposalsContracts'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProposalsController.prototype, "updateCompanyProfile", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, plan_guard_1.PlanGuard),
    (0, require_module_decorator_1.RequireModule)('proposalsContracts'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProposalsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, plan_guard_1.PlanGuard),
    (0, require_module_decorator_1.RequireModule)('proposalsContracts'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_proposal_dto_1.UpdateProposalDto]),
    __metadata("design:returntype", Promise)
], ProposalsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, plan_guard_1.PlanGuard),
    (0, require_module_decorator_1.RequireModule)('proposalsContracts'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_proposal_dto_1.UpdateProposalDto]),
    __metadata("design:returntype", Promise)
], ProposalsController.prototype, "patch", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, plan_guard_1.PlanGuard),
    (0, require_module_decorator_1.RequireModule)('proposalsContracts'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_proposal_status_dto_1.UpdateProposalStatusDto]),
    __metadata("design:returntype", Promise)
], ProposalsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)('public/:codeOrId'),
    __param(0, (0, common_1.Param)('codeOrId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProposalsController.prototype, "getPublic", null);
__decorate([
    (0, common_1.Post)('public/:codeOrId/accept'),
    __param(0, (0, common_1.Param)('codeOrId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProposalsController.prototype, "acceptPublic", null);
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
], ProposalsController.prototype, "getWhatsAppShare", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], ProposalsController.prototype, "getPdf", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, plan_guard_1.PlanGuard),
    (0, require_module_decorator_1.RequireModule)('proposalsContracts'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProposalsController.prototype, "delete", null);
exports.ProposalsController = ProposalsController = __decorate([
    (0, common_1.Controller)('proposals'),
    __metadata("design:paramtypes", [proposals_service_1.ProposalsService])
], ProposalsController);
//# sourceMappingURL=proposals.controller.js.map