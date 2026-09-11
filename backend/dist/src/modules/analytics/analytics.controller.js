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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const analytics_service_1 = require("./analytics.service");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const tenant_decorator_1 = require("../../shared/decorators/tenant.decorator");
let AnalyticsController = class AnalyticsController {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async getOverview(tenantId, startDate, endDate) {
        return this.analyticsService.getOverview(tenantId, startDate, endDate);
    }
    async getCharts(tenantId, startDate, endDate) {
        return this.analyticsService.getCharts(tenantId, startDate, endDate);
    }
    async getAgentPerformance(tenantId, startDate, endDate) {
        return this.analyticsService.getAgentPerformance(tenantId, startDate, endDate);
    }
    async getDetailedTickets(tenantId, startDate, endDate, agentId, departmentId, status, page, limit, search) {
        return this.analyticsService.getDetailedTickets(tenantId, {
            startDate,
            endDate,
            agentId,
            departmentId,
            status,
            page,
            limit,
            search,
        });
    }
    async getAiCosts(tenantId, startDate, endDate) {
        return this.analyticsService.getAiCosts(tenantId, startDate, endDate);
    }
    async getCsat(tenantId, startDate, endDate) {
        return this.analyticsService.getCsat(tenantId, startDate, endDate);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('overview'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('charts'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getCharts", null);
__decorate([
    (0, common_1.Get)('agent-performance'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getAgentPerformance", null);
__decorate([
    (0, common_1.Get)('detailed-tickets'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('agentId')),
    __param(4, (0, common_1.Query)('departmentId')),
    __param(5, (0, common_1.Query)('status')),
    __param(6, (0, common_1.Query)('page')),
    __param(7, (0, common_1.Query)('limit')),
    __param(8, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, Number, Number, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDetailedTickets", null);
__decorate([
    (0, common_1.Get)('ai-costs'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getAiCosts", null);
__decorate([
    (0, common_1.Get)('csat'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getCsat", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, common_1.Controller)('analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map