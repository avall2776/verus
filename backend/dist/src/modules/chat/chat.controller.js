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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const chat_service_1 = require("./chat.service");
const send_message_dto_1 = require("./dto/send-message.dto");
const schedule_message_dto_1 = require("./dto/schedule-message.dto");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const tenant_decorator_1 = require("../../shared/decorators/tenant.decorator");
let ChatController = class ChatController {
    constructor(chatService) {
        this.chatService = chatService;
    }
    async listConversations(tenantId, req, tab, status) {
        const selectedTab = tab || status || 'waiting';
        return this.chatService.findAllConversations(tenantId, req.user.id, req.user.role, selectedTab);
    }
    async getConversationCounts(tenantId, req) {
        return this.chatService.getConversationCounts(tenantId, req.user.id, req.user.role);
    }
    async getOperatorProductivity(tenantId, req) {
        return this.chatService.getOperatorProductivity(tenantId, req.user.id);
    }
    async getAllScheduledMessages(tenantId) {
        return this.chatService.getAllScheduledMessages(tenantId);
    }
    async batchCancelScheduledMessages(tenantId, body) {
        return this.chatService.batchCancelScheduledMessages(tenantId, body.messageIds);
    }
    async getMessages(tenantId, conversationId) {
        return this.chatService.getConversationMessages(tenantId, conversationId);
    }
    async getConversationByContact(tenantId, contactId) {
        return this.chatService.getConversationByContact(tenantId, contactId);
    }
    async getConversation(tenantId, conversationId) {
        return this.chatService.getConversationById(tenantId, conversationId);
    }
    async takeover(tenantId, conversationId, req) {
        return this.chatService.takeoverConversation(tenantId, conversationId, req.user.id);
    }
    async release(tenantId, conversationId) {
        return this.chatService.releaseConversation(tenantId, conversationId);
    }
    async resolve(tenantId, conversationId) {
        return this.chatService.releaseConversation(tenantId, conversationId);
    }
    async reopen(tenantId, conversationId) {
        return this.chatService.reopenConversation(tenantId, conversationId);
    }
    async markAsRead(tenantId, conversationId) {
        return this.chatService.markAsRead(tenantId, conversationId);
    }
    async markAsUnread(tenantId, conversationId) {
        return this.chatService.markAsUnread(tenantId, conversationId);
    }
    async ignore(tenantId, conversationId) {
        return this.chatService.releaseConversation(tenantId, conversationId);
    }
    async transfer(tenantId, req, conversationId, body) {
        const operatorName = req.user?.name || req.user?.email || 'Um operador';
        return this.chatService.transferToDepartment(tenantId, conversationId, body.departmentId, body.userId, operatorName);
    }
    async assign(tenantId, req, conversationId, body) {
        const operatorName = req.user?.name || req.user?.email || 'Um operador';
        return this.chatService.assignToUser(tenantId, conversationId, body.userId, operatorName);
    }
    async sendMessage(tenantId, conversationId, payload) {
        try {
            return await this.chatService.sendManualMessage(tenantId, conversationId, payload);
        }
        catch (error) {
            console.error('ERRO AO ENVIAR MENSAGEM MANUAL:', error);
            throw error;
        }
    }
    async sendAudioMessage(tenantId, conversationId, file, isInternal, content, instanceId) {
        if (!file) {
            throw new common_1.BadRequestException('Arquivo de áudio obrigatório.');
        }
        return this.chatService.sendManualAudioMessage(tenantId, conversationId, file, {
            isInternal: isInternal === 'true' || isInternal === true,
            content: content || '🎤 Mensagem de voz',
            instanceId,
        });
    }
    async scheduleMessage(tenantId, conversationId, payload) {
        try {
            return await this.chatService.scheduleMessage(tenantId, conversationId, payload);
        }
        catch (error) {
            console.error('ERRO AO AGENDAR MENSAGEM:', error);
            throw error;
        }
    }
    async getScheduledMessages(tenantId, conversationId) {
        return this.chatService.getScheduledMessages(tenantId, conversationId);
    }
    async cancelScheduledMessage(tenantId, messageId) {
        return this.chatService.cancelScheduledMessage(tenantId, messageId);
    }
    async sendMessageToContact(tenantId, contactId, payload, req) {
        try {
            return await this.chatService.sendManualMessageToContact(tenantId, contactId, payload, req.user.id);
        }
        catch (error) {
            console.error('ERRO AO ENVIAR MENSAGEM DIRETA:', error);
            throw error;
        }
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Query)('tab')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "listConversations", null);
__decorate([
    (0, common_1.Get)('counts'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getConversationCounts", null);
__decorate([
    (0, common_1.Get)('operator-productivity'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getOperatorProductivity", null);
__decorate([
    (0, common_1.Get)('scheduled/all'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getAllScheduledMessages", null);
__decorate([
    (0, common_1.Post)('scheduled/batch-cancel'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "batchCancelScheduledMessages", null);
__decorate([
    (0, common_1.Get)(':id/messages'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getMessages", null);
__decorate([
    (0, common_1.Get)('contact/:contactId'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('contactId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getConversationByContact", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getConversation", null);
__decorate([
    (0, common_1.Patch)(':id/takeover'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "takeover", null);
__decorate([
    (0, common_1.Patch)(':id/release'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "release", null);
__decorate([
    (0, common_1.Patch)(':id/resolve'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "resolve", null);
__decorate([
    (0, common_1.Patch)(':id/reopen'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "reopen", null);
__decorate([
    (0, common_1.Patch)(':id/read'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Patch)(':id/unread'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "markAsUnread", null);
__decorate([
    (0, common_1.Patch)(':id/ignore'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "ignore", null);
__decorate([
    (0, common_1.Patch)(':id/transfer'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "transfer", null);
__decorate([
    (0, common_1.Patch)(':id/assign'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "assign", null);
__decorate([
    (0, common_1.Post)(':id/messages'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, send_message_dto_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)(':id/messages/audio'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.UploadedFile)()),
    __param(3, (0, common_1.Body)('isInternal')),
    __param(4, (0, common_1.Body)('content')),
    __param(5, (0, common_1.Body)('instanceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendAudioMessage", null);
__decorate([
    (0, common_1.Post)(':id/schedule'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, schedule_message_dto_1.ScheduleMessageDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "scheduleMessage", null);
__decorate([
    (0, common_1.Get)(':id/scheduled'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getScheduledMessages", null);
__decorate([
    (0, common_1.Delete)('messages/:messageId/schedule'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('messageId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "cancelScheduledMessage", null);
__decorate([
    (0, common_1.Post)('contact/:contactId/messages'),
    __param(0, (0, tenant_decorator_1.CurrentTenant)()),
    __param(1, (0, common_1.Param)('contactId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, send_message_dto_1.SendMessageDto, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessageToContact", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)('conversations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map