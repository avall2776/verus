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
exports.EmailsController = void 0;
const common_1 = require("@nestjs/common");
const emails_service_1 = require("./emails.service");
const send_email_dto_1 = require("./dto/send-email.dto");
const update_email_dto_1 = require("./dto/update-email.dto");
const email_settings_dto_1 = require("./dto/email-settings.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const tenant_decorator_1 = require("../../shared/decorators/tenant.decorator");
let EmailsController = class EmailsController {
    constructor(emailsService) {
        this.emailsService = emailsService;
    }
    async getEmailSettings(tenantId) {
        return this.emailsService.getEmailSettings(tenantId);
    }
    async saveEmailSettings(tenantId, dto) {
        return this.emailsService.saveEmailSettings(tenantId, dto);
    }
    async testConnection(tenantId, dto) {
        return this.emailsService.testConnection(tenantId, dto);
    }
    async syncEmails(tenantId) {
        return this.emailsService.syncEmails(tenantId);
    }
    async getTransportStatus(tenantId) {
        return this.emailsService.getTransportStatus(tenantId);
    }
    async listEmails(tenantId, folder, search, isStarred, isRead, page, limit) {
        return this.emailsService.listEmails(tenantId, {
            folder,
            search,
            isStarred,
            isRead,
            page,
            limit,
        });
    }
    async getCounts(tenantId) {
        return this.emailsService.getCounts(tenantId);
    }
    async getEmailById(tenantId, id) {
        return this.emailsService.getEmailById(tenantId, id);
    }
    async sendEmail(tenantId, dto) {
        return this.emailsService.sendEmail(tenantId, dto);
    }
    async toggleStar(tenantId, id) {
        return this.emailsService.toggleStar(tenantId, id);
    }
    async moveToFolder(tenantId, id, folder) {
        return this.emailsService.moveToFolder(tenantId, id, folder);
    }
    async updateEmail(tenantId, id, dto) {
        return this.emailsService.updateEmail(tenantId, id, dto);
    }
    async deleteEmail(tenantId, id) {
        return this.emailsService.deleteEmail(tenantId, id);
    }
};
exports.EmailsController = EmailsController;
__decorate([
    (0, common_1.Get)('settings'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "getEmailSettings", null);
__decorate([
    (0, common_1.Post)('settings'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, email_settings_dto_1.EmailSettingsDto]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "saveEmailSettings", null);
__decorate([
    (0, common_1.Post)('test-connection'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, email_settings_dto_1.EmailSettingsDto]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "testConnection", null);
__decorate([
    (0, common_1.Post)('sync'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "syncEmails", null);
__decorate([
    (0, common_1.Get)('transport/status'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "getTransportStatus", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('folder')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('isStarred')),
    __param(4, (0, common_1.Query)('isRead')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "listEmails", null);
__decorate([
    (0, common_1.Get)('counts'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "getCounts", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "getEmailById", null);
__decorate([
    (0, common_1.Post)('send'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, send_email_dto_1.SendEmailDto]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "sendEmail", null);
__decorate([
    (0, common_1.Patch)(':id/star'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "toggleStar", null);
__decorate([
    (0, common_1.Patch)(':id/folder'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('folder')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "moveToFolder", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_email_dto_1.UpdateEmailDto]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "updateEmail", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], EmailsController.prototype, "deleteEmail", null);
exports.EmailsController = EmailsController = __decorate([
    (0, common_1.Controller)('emails'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [emails_service_1.EmailsService])
], EmailsController);
//# sourceMappingURL=emails.controller.js.map