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
exports.EngineeringController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const engineering_service_1 = require("./engineering.service");
const create_engineering_item_dto_1 = require("./dto/create-engineering-item.dto");
const update_engineering_item_dto_1 = require("./dto/update-engineering-item.dto");
const create_from_ticket_dto_1 = require("./dto/create-from-ticket.dto");
const chat_engineering_dto_1 = require("./dto/chat-engineering.dto");
const create_card_from_chat_dto_1 = require("./dto/create-card-from-chat.dto");
const update_checklist_dto_1 = require("./dto/update-checklist.dto");
const product_chat_dto_1 = require("./dto/product-chat.dto");
const update_product_status_dto_1 = require("./dto/update-product-status.dto");
let EngineeringController = class EngineeringController {
    constructor(engineeringService) {
        this.engineeringService = engineeringService;
    }
    checkSuperAdmin(req) {
        const isSuperAdmin = Boolean(req.user?.isSuperAdmin || req.user?.role === 'SUPER_ADMIN');
        if (!isSuperAdmin) {
            throw new common_1.ForbiddenException('Acesso restrito exclusivamente ao Super Administrador.');
        }
    }
    async getBacklog(req, stage, category, priority, search) {
        this.checkSuperAdmin(req);
        return this.engineeringService.getBacklog({ stage, category, priority, search });
    }
    async findById(req, id) {
        this.checkSuperAdmin(req);
        return this.engineeringService.findById(id);
    }
    async create(req, dto) {
        this.checkSuperAdmin(req);
        return this.engineeringService.create(dto);
    }
    async update(req, id, dto) {
        this.checkSuperAdmin(req);
        return this.engineeringService.update(id, dto);
    }
    async updateChecklist(req, id, dto) {
        this.checkSuperAdmin(req);
        return this.engineeringService.updateChecklist(id, dto);
    }
    async delete(req, id) {
        this.checkSuperAdmin(req);
        return this.engineeringService.delete(id);
    }
    async createFromTicket(req, dto) {
        this.checkSuperAdmin(req);
        return this.engineeringService.createFromTicket(dto);
    }
    async analyzeItem(req, id) {
        this.checkSuperAdmin(req);
        return this.engineeringService.analyzeItemWithAI(id);
    }
    async getChatHistory(req) {
        this.checkSuperAdmin(req);
        return this.engineeringService.getChatHistory();
    }
    async chatWithAI(req, dto) {
        this.checkSuperAdmin(req);
        return this.engineeringService.chatWithEngineeringAI(dto);
    }
    async createCardFromChat(req, dto) {
        this.checkSuperAdmin(req);
        return this.engineeringService.createCardFromChat(dto);
    }
    async transcribeAudio(req, file) {
        this.checkSuperAdmin(req);
        if (!file) {
            throw new common_1.BadRequestException('Arquivo de áudio não enviado.');
        }
        return this.engineeringService.transcribeAudio(file);
    }
    async clearChatHistory(req) {
        this.checkSuperAdmin(req);
        return this.engineeringService.clearChatHistory();
    }
    async syncDeploy(req) {
        this.checkSuperAdmin(req);
        return this.engineeringService.syncDeploy();
    }
    async getProducts(req) {
        this.checkSuperAdmin(req);
        return this.engineeringService.getProducts();
    }
    async getProductById(req, id) {
        this.checkSuperAdmin(req);
        return this.engineeringService.getProductById(id);
    }
    async updateProductStatus(req, id, dto) {
        this.checkSuperAdmin(req);
        return this.engineeringService.updateProductStatus(id, dto.status);
    }
    async chatWithProductAI(req, id, dto) {
        this.checkSuperAdmin(req);
        return this.engineeringService.chatWithProductAI(id, dto);
    }
    async getProductChatHistory(req, id) {
        this.checkSuperAdmin(req);
        return this.engineeringService.getProductChatHistory(id);
    }
    async runSandboxTest(req, id) {
        this.checkSuperAdmin(req);
        return this.engineeringService.runSandboxTest(id);
    }
    async getProductLogs(req, id) {
        this.checkSuperAdmin(req);
        return this.engineeringService.getProductLogs(id);
    }
    async clearProductLogs(req, id) {
        this.checkSuperAdmin(req);
        return this.engineeringService.clearProductLogs(id);
    }
    async integrateProductToProduction(req, id) {
        this.checkSuperAdmin(req);
        return this.engineeringService.integrateProductToProduction(id);
    }
};
exports.EngineeringController = EngineeringController;
__decorate([
    (0, common_1.Get)('items'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('stage')),
    __param(2, (0, common_1.Query)('category')),
    __param(3, (0, common_1.Query)('priority')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], EngineeringController.prototype, "getBacklog", null);
__decorate([
    (0, common_1.Get)('items/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EngineeringController.prototype, "findById", null);
__decorate([
    (0, common_1.Post)('items'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_engineering_item_dto_1.CreateEngineeringItemDto]),
    __metadata("design:returntype", Promise)
], EngineeringController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('items/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_engineering_item_dto_1.UpdateEngineeringItemDto]),
    __metadata("design:returntype", Promise)
], EngineeringController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)('items/:id/checklist'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_checklist_dto_1.UpdateChecklistDto]),
    __metadata("design:returntype", Promise)
], EngineeringController.prototype, "updateChecklist", null);
__decorate([
    (0, common_1.Delete)('items/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EngineeringController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)('items/from-ticket'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_from_ticket_dto_1.CreateFromTicketDto]),
    __metadata("design:returntype", Promise)
], EngineeringController.prototype, "createFromTicket", null);
__decorate([
    (0, common_1.Post)('items/:id/analyze'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EngineeringController.prototype, "analyzeItem", null);
__decorate([
    (0, common_1.Get)('chat/history'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EngineeringController.prototype, "getChatHistory", null);
__decorate([
    (0, common_1.Post)('chat'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, chat_engineering_dto_1.ChatEngineeringDto]),
    __metadata("design:returntype", Promise)
], EngineeringController.prototype, "chatWithAI", null);
__decorate([
    (0, common_1.Post)('chat/create-card'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_card_from_chat_dto_1.CreateCardFromChatDto]),
    __metadata("design:returntype", Promise)
], EngineeringController.prototype, "createCardFromChat", null);
__decorate([
    (0, common_1.Post)('chat/transcribe-audio'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EngineeringController.prototype, "transcribeAudio", null);
__decorate([
    (0, common_1.Delete)('chat/history'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EngineeringController.prototype, "clearChatHistory", null);
__decorate([
    (0, common_1.Post)('sync-deploy'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EngineeringController.prototype, "syncDeploy", null);
__decorate([
    (0, common_1.Get)('products'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EngineeringController.prototype, "getProducts", null);
__decorate([
    (0, common_1.Get)('products/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EngineeringController.prototype, "getProductById", null);
__decorate([
    (0, common_1.Patch)('products/:id/status'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_product_status_dto_1.UpdateProductStatusDto]),
    __metadata("design:returntype", Promise)
], EngineeringController.prototype, "updateProductStatus", null);
__decorate([
    (0, common_1.Post)('products/:id/chat'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, product_chat_dto_1.ProductChatDto]),
    __metadata("design:returntype", Promise)
], EngineeringController.prototype, "chatWithProductAI", null);
__decorate([
    (0, common_1.Get)('products/:id/chat-history'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EngineeringController.prototype, "getProductChatHistory", null);
__decorate([
    (0, common_1.Post)('products/:id/test'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EngineeringController.prototype, "runSandboxTest", null);
__decorate([
    (0, common_1.Get)('products/:id/logs'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EngineeringController.prototype, "getProductLogs", null);
__decorate([
    (0, common_1.Post)('products/:id/clear-logs'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EngineeringController.prototype, "clearProductLogs", null);
__decorate([
    (0, common_1.Post)('products/:id/integrate'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], EngineeringController.prototype, "integrateProductToProduction", null);
exports.EngineeringController = EngineeringController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('engineering'),
    __metadata("design:paramtypes", [engineering_service_1.EngineeringService])
], EngineeringController);
//# sourceMappingURL=engineering.controller.js.map