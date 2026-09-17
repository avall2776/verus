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
exports.OperatorsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const operators_service_1 = require("./operators.service");
const create_operator_dto_1 = require("./dto/create-operator.dto");
const update_operator_dto_1 = require("./dto/update-operator.dto");
let OperatorsController = class OperatorsController {
    constructor(operatorsService) {
        this.operatorsService = operatorsService;
    }
    checkSuperAdmin(req) {
        const isSuperAdmin = Boolean(req.user?.isSuperAdmin || req.user?.role === 'SUPER_ADMIN');
        if (!isSuperAdmin) {
            throw new common_1.ForbiddenException('Acesso restrito exclusivamente ao Super Administrador.');
        }
    }
    async findAll(req) {
        this.checkSuperAdmin(req);
        return this.operatorsService.findAllWithMetrics();
    }
    async getLiveChats(req, id) {
        this.checkSuperAdmin(req);
        return this.operatorsService.getLiveChatsForOperator(id);
    }
    async create(req, dto) {
        this.checkSuperAdmin(req);
        const inviterName = req.user?.name || 'Super Admin VERSUS';
        return this.operatorsService.createOperator(dto, inviterName);
    }
    async update(req, id, dto) {
        this.checkSuperAdmin(req);
        return this.operatorsService.updateOperator(id, dto);
    }
    async delete(req, id) {
        this.checkSuperAdmin(req);
        return this.operatorsService.deleteOperator(id);
    }
};
exports.OperatorsController = OperatorsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OperatorsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/live-chats'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], OperatorsController.prototype, "getLiveChats", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_operator_dto_1.CreateOperatorDto]),
    __metadata("design:returntype", Promise)
], OperatorsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_operator_dto_1.UpdateOperatorDto]),
    __metadata("design:returntype", Promise)
], OperatorsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], OperatorsController.prototype, "delete", null);
exports.OperatorsController = OperatorsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('operators'),
    __metadata("design:paramtypes", [operators_service_1.OperatorsService])
], OperatorsController);
//# sourceMappingURL=operators.controller.js.map