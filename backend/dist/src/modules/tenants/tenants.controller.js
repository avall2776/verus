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
exports.TenantsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const super_admin_guard_1 = require("../../shared/guards/super-admin.guard");
const tenants_service_1 = require("./tenants.service");
const query_tenants_dto_1 = require("./dto/query-tenants.dto");
const update_tenant_status_dto_1 = require("./dto/update-tenant-status.dto");
const update_tenant_dto_1 = require("./dto/update-tenant.dto");
const reset_admin_password_dto_1 = require("./dto/reset-admin-password.dto");
const create_tenant_dto_1 = require("./dto/create-tenant.dto");
const create_plan_dto_1 = require("./dto/create-plan.dto");
const tenant_decorator_1 = require("../../shared/decorators/tenant.decorator");
let TenantsController = class TenantsController {
    constructor(tenantsService) {
        this.tenantsService = tenantsService;
    }
    async checkSuperAdmin(req) {
        const userRole = String(req.user?.role || '').toUpperCase();
        const isSuperAdmin = Boolean(req.user?.isSuperAdmin ||
            userRole === 'SUPER_ADMIN' ||
            userRole === 'SUPERADMIN');
        if (isSuperAdmin) {
            return true;
        }
        const userId = req.user?.userId || req.user?.id;
        if (userId) {
            const user = await this.tenantsService.prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, role: true, isSuperAdmin: true },
            });
            if (user && (user.isSuperAdmin || String(user.role).toUpperCase() === 'SUPER_ADMIN')) {
                req.user.isSuperAdmin = true;
                req.user.role = 'SUPER_ADMIN';
                return true;
            }
        }
        throw new common_1.ForbiddenException('Acesso restrito exclusivamente ao Super Administrador.');
    }
    async getStats(req) {
        return this.tenantsService.getStats();
    }
    async getMyTenant(tenantId) {
        return this.tenantsService.getMyTenant(tenantId);
    }
    async updateMyTenant(tenantId, body) {
        return this.tenantsService.updateMyTenant(tenantId, body);
    }
    async findAll(req, query) {
        return this.tenantsService.findAll(query);
    }
    async create(req, body) {
        return this.tenantsService.create(body);
    }
    async getPlans(req) {
        return this.tenantsService.getPlans();
    }
    async createPlan(req, body) {
        return this.tenantsService.createPlan(body);
    }
    async updatePlan(req, id, body) {
        return this.tenantsService.updatePlan(id, body);
    }
    async findOne(req, id) {
        return this.tenantsService.findOne(id);
    }
    async update(req, id, body) {
        return this.tenantsService.update(id, body);
    }
    async updatePut(req, id, body) {
        return this.tenantsService.update(id, body);
    }
    async updateStatus(req, id, body) {
        return this.tenantsService.updateStatus(id, body.isActive);
    }
    async resetAdminPassword(req, id, body) {
        return this.tenantsService.resetAdminPassword(id, body?.newPassword);
    }
    async updateTenantUser(req, tenantId, userId, body) {
        return this.tenantsService.updateTenantUser(tenantId, userId, body);
    }
    async resetTenantUserPassword(req, tenantId, userId, body) {
        return this.tenantsService.resetTenantUserPassword(tenantId, userId, body);
    }
    async deleteTenantUser(req, tenantId, userId) {
        return this.tenantsService.deleteTenantUser(tenantId, userId);
    }
};
exports.TenantsController = TenantsController;
__decorate([
    (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Get)('stats/overview'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "getMyTenant", null);
__decorate([
    (0, common_1.Patch)('me'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "updateMyTenant", null);
__decorate([
    (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_tenants_dto_1.QueryTenantsDto]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_tenant_dto_1.CreateTenantDto]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Get)('plans/list'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "getPlans", null);
__decorate([
    (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Post)('plans'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_plan_dto_1.CreatePlanDto]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "createPlan", null);
__decorate([
    (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Patch)('plans/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_tenant_dto_1.UpdateTenantDto]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_tenant_dto_1.UpdateTenantDto]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "updatePut", null);
__decorate([
    (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Patch)(':id/status'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_tenant_status_dto_1.UpdateTenantStatusDto]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Post)(':id/reset-admin-password'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, reset_admin_password_dto_1.ResetAdminPasswordDto]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "resetAdminPassword", null);
__decorate([
    (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Patch)(':tenantId/users/:userId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('tenantId')),
    __param(2, (0, common_1.Param)('userId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "updateTenantUser", null);
__decorate([
    (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Post)(':tenantId/users/:userId/reset-password'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('tenantId')),
    __param(2, (0, common_1.Param)('userId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "resetTenantUserPassword", null);
__decorate([
    (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Delete)(':tenantId/users/:userId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('tenantId')),
    __param(2, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "deleteTenantUser", null);
exports.TenantsController = TenantsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('tenants'),
    __metadata("design:paramtypes", [tenants_service_1.TenantsService])
], TenantsController);
//# sourceMappingURL=tenants.controller.js.map