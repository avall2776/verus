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
exports.GoalsController = void 0;
const common_1 = require("@nestjs/common");
const goals_service_1 = require("./goals.service");
const create_goal_dto_1 = require("./dto/create-goal.dto");
const update_goal_dto_1 = require("./dto/update-goal.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const tenant_decorator_1 = require("../../shared/decorators/tenant.decorator");
let GoalsController = class GoalsController {
    constructor(goalsService) {
        this.goalsService = goalsService;
    }
    async findAll(tenantId) {
        return this.goalsService.findAll(tenantId);
    }
    async getSummary(tenantId) {
        return this.goalsService.getSummary(tenantId);
    }
    async create(tenantId, dto) {
        return this.goalsService.create(tenantId, dto);
    }
    async update(tenantId, id, dto) {
        return this.goalsService.update(tenantId, id, dto);
    }
    async delete(tenantId, id) {
        return this.goalsService.delete(tenantId, id);
    }
    async getLeaderboard(tenantId) {
        return this.goalsService.getLeaderboard(tenantId);
    }
    async getSellerDetails(tenantId, userId) {
        return this.goalsService.getSellerDetails(tenantId, userId);
    }
};
exports.GoalsController = GoalsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GoalsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('summary'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GoalsController.prototype, "getSummary", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_goal_dto_1.CreateGoalDto]),
    __metadata("design:returntype", Promise)
], GoalsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_goal_dto_1.UpdateGoalDto]),
    __metadata("design:returntype", Promise)
], GoalsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GoalsController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)('leaderboard'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GoalsController.prototype, "getLeaderboard", null);
__decorate([
    (0, common_1.Get)('leaderboard/:userId/details'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GoalsController.prototype, "getSellerDetails", null);
exports.GoalsController = GoalsController = __decorate([
    (0, common_1.Controller)('goals'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [goals_service_1.GoalsService])
], GoalsController);
//# sourceMappingURL=goals.controller.js.map