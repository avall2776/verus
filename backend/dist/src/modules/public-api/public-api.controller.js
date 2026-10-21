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
exports.PublicApiController = void 0;
const common_1 = require("@nestjs/common");
const public_api_key_guard_1 = require("./guards/public-api-key.guard");
const public_api_service_1 = require("./public-api.service");
const create_lead_dto_1 = require("./dto/create-lead.dto");
let PublicApiController = class PublicApiController {
    constructor(publicApiService) {
        this.publicApiService = publicApiService;
    }
    async checkHealth(req) {
        return {
            success: true,
            status: 'active',
            tenantId: req.tenantId,
            tenantName: req.tenant?.name,
            tokenName: req.apiToken?.name,
            authenticatedAt: new Date().toISOString(),
            version: '1.0.0',
        };
    }
    async createLead(req, body) {
        return this.publicApiService.createLead(req.tenantId, body);
    }
    async getFunnels(req) {
        return this.publicApiService.getFunnels(req.tenantId);
    }
    async getUsers(req) {
        return this.publicApiService.getUsers(req.tenantId);
    }
    async createContact(req, body) {
        return this.publicApiService.createContact(req.tenantId, body);
    }
    async createDeal(req, body) {
        return this.publicApiService.createDeal(req.tenantId, body);
    }
};
exports.PublicApiController = PublicApiController;
__decorate([
    (0, common_1.Get)(['health', 'me', 'verify']),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PublicApiController.prototype, "checkHealth", null);
__decorate([
    (0, common_1.Post)('leads'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_lead_dto_1.CreateLeadDto]),
    __metadata("design:returntype", Promise)
], PublicApiController.prototype, "createLead", null);
__decorate([
    (0, common_1.Get)('funnels'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PublicApiController.prototype, "getFunnels", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PublicApiController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Post)('contacts'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PublicApiController.prototype, "createContact", null);
__decorate([
    (0, common_1.Post)('deals'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PublicApiController.prototype, "createDeal", null);
exports.PublicApiController = PublicApiController = __decorate([
    (0, common_1.Controller)(['api/v1/public', 'public-api']),
    (0, common_1.UseGuards)(public_api_key_guard_1.PublicApiKeyGuard),
    __metadata("design:paramtypes", [public_api_service_1.PublicApiService])
], PublicApiController);
//# sourceMappingURL=public-api.controller.js.map