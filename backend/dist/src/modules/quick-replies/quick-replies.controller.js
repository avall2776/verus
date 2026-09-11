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
exports.QuickRepliesController = void 0;
const common_1 = require("@nestjs/common");
const quick_replies_service_1 = require("./quick-replies.service");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
let QuickRepliesController = class QuickRepliesController {
    constructor(quickRepliesService) {
        this.quickRepliesService = quickRepliesService;
    }
    async getQuickReplies(req) {
        return this.quickRepliesService.findAll(req.user.tenantId);
    }
    async createQuickReply(req, body) {
        return this.quickRepliesService.create(req.user.tenantId, body.shortcut, body.content);
    }
    async updateQuickReply(req, id, body) {
        return this.quickRepliesService.update(req.user.tenantId, id, body);
    }
    async deleteQuickReply(req, id) {
        return this.quickRepliesService.delete(req.user.tenantId, id);
    }
};
exports.QuickRepliesController = QuickRepliesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], QuickRepliesController.prototype, "getQuickReplies", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], QuickRepliesController.prototype, "createQuickReply", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], QuickRepliesController.prototype, "updateQuickReply", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], QuickRepliesController.prototype, "deleteQuickReply", null);
exports.QuickRepliesController = QuickRepliesController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('quick-replies'),
    __metadata("design:paramtypes", [quick_replies_service_1.QuickRepliesService])
], QuickRepliesController);
//# sourceMappingURL=quick-replies.controller.js.map