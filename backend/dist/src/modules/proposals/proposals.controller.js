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
const update_proposal_status_dto_1 = require("./dto/update-proposal-status.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
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
    async findOne(tenantId, id) {
        return this.proposalsService.findOne(tenantId, id);
    }
    async updateStatus(tenantId, id, dto) {
        return this.proposalsService.updateStatus(tenantId, id, dto);
    }
    async getPdf(tenantId, id, res) {
        const html = await this.proposalsService.generatePdfHtml(tenantId, id);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
    }
};
exports.ProposalsController = ProposalsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProposalsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_proposal_dto_1.CreateProposalDto]),
    __metadata("design:returntype", Promise)
], ProposalsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProposalsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_proposal_status_dto_1.UpdateProposalStatusDto]),
    __metadata("design:returntype", Promise)
], ProposalsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ProposalsController.prototype, "getPdf", null);
exports.ProposalsController = ProposalsController = __decorate([
    (0, common_1.Controller)('proposals'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [proposals_service_1.ProposalsService])
], ProposalsController);
//# sourceMappingURL=proposals.controller.js.map