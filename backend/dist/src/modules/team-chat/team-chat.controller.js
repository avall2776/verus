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
exports.TeamChatController = void 0;
const common_1 = require("@nestjs/common");
const team_chat_service_1 = require("./team-chat.service");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const plan_guard_1 = require("../../shared/guards/plan.guard");
const require_module_decorator_1 = require("../../shared/decorators/require-module.decorator");
const tenant_decorator_1 = require("../../shared/decorators/tenant.decorator");
let TeamChatController = class TeamChatController {
    constructor(teamChatService) {
        this.teamChatService = teamChatService;
    }
    async getUsers(tenantId, req) {
        return this.teamChatService.getUsers(tenantId, req?.user?.id);
    }
    async getDepartments(tenantId) {
        return this.teamChatService.getDepartments(tenantId);
    }
    async getChannels(tenantId) {
        return this.teamChatService.getChannels(tenantId);
    }
    async createChannel(tenantId, body) {
        return this.teamChatService.createChannel(tenantId, body);
    }
    async deleteChannel(tenantId, channelId, req) {
        return this.teamChatService.deleteChannel(tenantId, req?.user?.id, req?.user?.role, channelId);
    }
    async getMessages(tenantId, channelId, receiverId, req) {
        return this.teamChatService.getMessages(tenantId, req.user.id, channelId, receiverId);
    }
    async sendMessage(tenantId, req, body) {
        return this.teamChatService.sendMessage(tenantId, req.user.id, body);
    }
    async deleteMessage(tenantId, messageId, req) {
        return this.teamChatService.deleteMessage(tenantId, req?.user?.id, req?.user?.role, messageId);
    }
    async clearHistory(tenantId, channelId, receiverId, req) {
        return this.teamChatService.clearHistory(tenantId, req?.user?.id, req?.user?.role, {
            channelId,
            receiverId,
        });
    }
};
exports.TeamChatController = TeamChatController;
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TeamChatController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('departments'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeamChatController.prototype, "getDepartments", null);
__decorate([
    (0, common_1.Get)('channels'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeamChatController.prototype, "getChannels", null);
__decorate([
    (0, common_1.Post)('channels'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TeamChatController.prototype, "createChannel", null);
__decorate([
    (0, common_1.Delete)('channels/:id'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TeamChatController.prototype, "deleteChannel", null);
__decorate([
    (0, common_1.Get)('messages'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('channelId')),
    __param(2, (0, common_1.Query)('receiverId')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], TeamChatController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Post)('messages'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TeamChatController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Delete)('messages/:id'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TeamChatController.prototype, "deleteMessage", null);
__decorate([
    (0, common_1.Delete)('history'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Query)('channelId')),
    __param(2, (0, common_1.Query)('receiverId')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], TeamChatController.prototype, "clearHistory", null);
exports.TeamChatController = TeamChatController = __decorate([
    (0, common_1.Controller)('team-chat'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, plan_guard_1.PlanGuard),
    (0, require_module_decorator_1.RequireModule)('teamChat'),
    __metadata("design:paramtypes", [team_chat_service_1.TeamChatService])
], TeamChatController);
//# sourceMappingURL=team-chat.controller.js.map