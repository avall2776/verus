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
exports.VoipController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const voip_service_1 = require("./voip.service");
const originate_call_dto_1 = require("./dto/originate-call.dto");
const update_voip_config_dto_1 = require("./dto/update-voip-config.dto");
const hangup_call_dto_1 = require("./dto/hangup-call.dto");
const dtmf_call_dto_1 = require("./dto/dtmf-call.dto");
const transfer_call_dto_1 = require("./dto/transfer-call.dto");
let VoipController = class VoipController {
    constructor(voipService) {
        this.voipService = voipService;
    }
    async getConfig(req) {
        return this.voipService.getConfig();
    }
    async updateConfig(req, dto) {
        return this.voipService.updateConfig(dto);
    }
    async originateCall(req, dto) {
        return this.voipService.originateCall(dto);
    }
    async hangupCall(req, dto) {
        return this.voipService.hangupCall(dto);
    }
    async sendDtmf(req, dto) {
        return this.voipService.sendDtmf(dto);
    }
    async toggleHold(req, id) {
        return this.voipService.toggleHold(id);
    }
    async transferCall(req, dto) {
        return this.voipService.transferCall(dto);
    }
    async getActiveCalls(req) {
        return this.voipService.getActiveCalls();
    }
    async getCallHistory(req) {
        return this.voipService.getCallHistory();
    }
    async testConnection(req) {
        return this.voipService.testConnection();
    }
};
exports.VoipController = VoipController;
__decorate([
    (0, common_1.Get)('config'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VoipController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Post)('config'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_voip_config_dto_1.UpdateVoipConfigDto]),
    __metadata("design:returntype", Promise)
], VoipController.prototype, "updateConfig", null);
__decorate([
    (0, common_1.Post)('call/originate'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, originate_call_dto_1.OriginateCallDto]),
    __metadata("design:returntype", Promise)
], VoipController.prototype, "originateCall", null);
__decorate([
    (0, common_1.Post)('call/hangup'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, hangup_call_dto_1.HangupCallDto]),
    __metadata("design:returntype", Promise)
], VoipController.prototype, "hangupCall", null);
__decorate([
    (0, common_1.Post)('call/dtmf'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dtmf_call_dto_1.DtmfCallDto]),
    __metadata("design:returntype", Promise)
], VoipController.prototype, "sendDtmf", null);
__decorate([
    (0, common_1.Post)('call/hold/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VoipController.prototype, "toggleHold", null);
__decorate([
    (0, common_1.Post)('call/transfer'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, transfer_call_dto_1.TransferCallDto]),
    __metadata("design:returntype", Promise)
], VoipController.prototype, "transferCall", null);
__decorate([
    (0, common_1.Get)('calls/active'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VoipController.prototype, "getActiveCalls", null);
__decorate([
    (0, common_1.Get)('calls/history'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VoipController.prototype, "getCallHistory", null);
__decorate([
    (0, common_1.Get)('test-connection'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VoipController.prototype, "testConnection", null);
exports.VoipController = VoipController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('voip'),
    __metadata("design:paramtypes", [voip_service_1.VoipService])
], VoipController);
//# sourceMappingURL=voip.controller.js.map