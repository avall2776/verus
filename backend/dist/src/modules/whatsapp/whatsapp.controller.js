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
exports.WhatsappController = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_service_1 = require("./whatsapp.service");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const tenant_decorator_1 = require("../../shared/decorators/tenant.decorator");
let WhatsappController = class WhatsappController {
    constructor(whatsappService) {
        this.whatsappService = whatsappService;
    }
    async getInstances(tenantId) {
        return this.whatsappService.getInstances(tenantId);
    }
    async createInstance(tenantId, body) {
        return this.whatsappService.createInstance(tenantId, body);
    }
    async getInstanceById(tenantId, id) {
        return this.whatsappService.getInstanceById(tenantId, id);
    }
    async updateInstance(tenantId, id, body) {
        return this.whatsappService.updateInstance(tenantId, id, body);
    }
    async deleteInstance(tenantId, id) {
        return this.whatsappService.deleteInstance(tenantId, id);
    }
    async connectInstance(tenantId, id, body) {
        return this.whatsappService.connectInstance(tenantId, id, body?.mode || 'meta');
    }
    async disconnectInstance(tenantId, id) {
        return this.whatsappService.disconnectInstance(tenantId, id);
    }
    async pairInstance(tenantId, id, body) {
        return this.whatsappService.pairInstance(tenantId, id, body?.phoneNumber);
    }
    async getConfig(tenantId) {
        return this.whatsappService.getConfig(tenantId);
    }
    async updateConfig(tenantId, body) {
        return this.whatsappService.updateConfig(tenantId, body);
    }
};
exports.WhatsappController = WhatsappController;
__decorate([
    (0, common_1.Get)('instances'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "getInstances", null);
__decorate([
    (0, common_1.Post)('instances'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "createInstance", null);
__decorate([
    (0, common_1.Get)('instances/:id'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "getInstanceById", null);
__decorate([
    (0, common_1.Patch)('instances/:id'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "updateInstance", null);
__decorate([
    (0, common_1.Delete)('instances/:id'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "deleteInstance", null);
__decorate([
    (0, common_1.Post)('instances/:id/connect'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "connectInstance", null);
__decorate([
    (0, common_1.Post)('instances/:id/disconnect'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "disconnectInstance", null);
__decorate([
    (0, common_1.Post)('instances/:id/pair'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "pairInstance", null);
__decorate([
    (0, common_1.Get)('config'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Patch)('config'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "updateConfig", null);
exports.WhatsappController = WhatsappController = __decorate([
    (0, common_1.Controller)('whatsapp'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [whatsapp_service_1.WhatsappService])
], WhatsappController);
//# sourceMappingURL=whatsapp.controller.js.map