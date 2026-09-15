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
const tenant_decorator_1 = require("../../shared/decorators/tenant.decorator");
let ContractsController = class ContractsController {
    constructor(contractsService) {
        this.contractsService = contractsService;
    }
    async findAll(tenantId) {
        return this.contractsService.findAll(tenantId);
    }
    async create(tenantId, dto) {
        return this.contractsService.create(tenantId, dto);
    }
    async findOne(tenantId, id) {
        return this.contractsService.findOne(tenantId, id);
    }
    async updateStatus(tenantId, id, dto) {
        return this.contractsService.updateStatus(tenantId, id, dto);
    }
};
exports.ContractsController = ContractsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_contract_dto_1.CreateContractDto]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_contract_status_dto_1.UpdateContractStatusDto]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "updateStatus", null);
exports.ContractsController = ContractsController = __decorate([
    (0, common_1.Controller)('contracts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [contracts_service_1.ContractsService])
], ContractsController);
//# sourceMappingURL=contracts.controller.js.map