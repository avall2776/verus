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
exports.SupportController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const plan_guard_1 = require("../../shared/guards/plan.guard");
const require_module_decorator_1 = require("../../shared/decorators/require-module.decorator");
const support_service_1 = require("./support.service");
const create_ticket_dto_1 = require("./dto/create-ticket.dto");
const create_ticket_message_dto_1 = require("./dto/create-ticket-message.dto");
const update_support_ai_config_dto_1 = require("./dto/update-support-ai-config.dto");
const toggle_ticket_ai_dto_1 = require("./dto/toggle-ticket-ai.dto");
const submit_csat_dto_1 = require("./dto/submit-csat.dto");
let SupportController = class SupportController {
    constructor(supportService) {
        this.supportService = supportService;
    }
    async findAll(req, query) {
        const isSuperAdmin = Boolean(req.user?.isSuperAdmin || req.user?.role === 'SUPER_ADMIN');
        const tenantId = req.user.tenantId;
        const userId = query.myOnly === 'true' ? (req.user.id || req.user.userId) : undefined;
        return this.supportService.findAll(tenantId, {
            status: query.status,
            priority: query.priority,
            category: query.category,
            search: query.search,
            userId,
            isSuperAdmin,
            targetTenantId: query.tenantId
        });
    }
    async getNotices(req) {
        const tenantId = req.user.tenantId;
        return this.supportService.getNotices(tenantId);
    }
    async findOne(req, id) {
        const isSuperAdmin = Boolean(req.user?.isSuperAdmin || req.user?.role === 'SUPER_ADMIN');
        const tenantId = req.user.tenantId;
        return this.supportService.findOne(id, tenantId, isSuperAdmin);
    }
    async create(req, dto) {
        const tenantId = req.user.tenantId;
        const userId = req.user.id || req.user.userId;
        return this.supportService.create(tenantId, userId, dto);
    }
    async addMessage(req, id, dto) {
        const isSuperAdmin = Boolean(req.user?.isSuperAdmin || req.user?.role === 'SUPER_ADMIN');
        const tenantId = req.user.tenantId;
        const userId = req.user.id || req.user.userId;
        return this.supportService.addMessage(id, tenantId, userId, dto, isSuperAdmin);
    }
    async updateStatus(req, id, body) {
        const isSuperAdmin = Boolean(req.user?.isSuperAdmin || req.user?.role === 'SUPER_ADMIN');
        const tenantId = req.user.tenantId;
        if (!body?.status) {
            throw new common_1.BadRequestException('Status é obrigatório.');
        }
        return this.supportService.updateStatus(id, tenantId, body.status, isSuperAdmin);
    }
    async assign(req, id, body) {
        const isSuperAdmin = Boolean(req.user?.isSuperAdmin || req.user?.role === 'SUPER_ADMIN');
        const tenantId = req.user.tenantId;
        return this.supportService.assign(id, tenantId, body?.assignedToId ?? null, isSuperAdmin);
    }
    async getAiCopilotSuggestion(req, id) {
        const isSuperAdmin = Boolean(req.user?.isSuperAdmin || req.user?.role === 'SUPER_ADMIN');
        const tenantId = req.user.tenantId;
        return this.supportService.generateCopilotSuggestion(id, tenantId, isSuperAdmin);
    }
    async getAiConfig() {
        return this.supportService.getAiConfig();
    }
    async updateAiConfig(dto) {
        return this.supportService.updateAiConfig(dto);
    }
    async toggleTicketAi(req, id, dto) {
        const isSuperAdmin = Boolean(req.user?.isSuperAdmin || req.user?.role === 'SUPER_ADMIN');
        const tenantId = req.user.tenantId;
        return this.supportService.toggleTicketAi(id, dto.isPaused, tenantId, isSuperAdmin);
    }
    async submitCsat(req, id, dto) {
        const tenantId = req.user.tenantId;
        return this.supportService.submitCsat(id, tenantId, dto);
    }
};
exports.SupportController = SupportController;
__decorate([
    (0, common_1.Get)('tickets'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('notices'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "getNotices", null);
__decorate([
    (0, common_1.Get)('tickets/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('tickets'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_ticket_dto_1.CreateTicketDto]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('tickets/:id/messages'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_ticket_message_dto_1.CreateTicketMessageDto]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "addMessage", null);
__decorate([
    (0, common_1.Patch)('tickets/:id/status'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)('tickets/:id/assign'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "assign", null);
__decorate([
    (0, common_1.Post)('tickets/:id/ai-copilot-suggest'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "getAiCopilotSuggestion", null);
__decorate([
    (0, common_1.Get)('ai/config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "getAiConfig", null);
__decorate([
    (0, common_1.Patch)('ai/config'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_support_ai_config_dto_1.UpdateSupportAiConfigDto]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "updateAiConfig", null);
__decorate([
    (0, common_1.Patch)('tickets/:id/toggle-ai'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, toggle_ticket_ai_dto_1.ToggleTicketAiDto]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "toggleTicketAi", null);
__decorate([
    (0, common_1.Post)('tickets/:id/csat'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, submit_csat_dto_1.SubmitCsatDto]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "submitCsat", null);
exports.SupportController = SupportController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, plan_guard_1.PlanGuard),
    (0, require_module_decorator_1.RequireModule)('support'),
    (0, common_1.Controller)('support'),
    __metadata("design:paramtypes", [support_service_1.SupportService])
], SupportController);
//# sourceMappingURL=support.controller.js.map