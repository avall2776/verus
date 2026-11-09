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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const session_service_1 = require("./services/session.service");
const jwt_auth_guard_1 = require("../../shared/guards/jwt-auth.guard");
const super_admin_guard_1 = require("../../shared/guards/super-admin.guard");
const client_telemetry_util_1 = require("./utils/client-telemetry.util");
const chat_gateway_1 = require("../chat/chat.gateway");
let AuthController = class AuthController {
    constructor(authService, sessionService, chatGateway) {
        this.authService = authService;
        this.sessionService = sessionService;
        this.chatGateway = chatGateway;
    }
    async login(req, body) {
        const telemetry = await (0, client_telemetry_util_1.extractFullTelemetry)(req);
        return this.authService.login(body.email, body.password, body.tenantId, telemetry, body.trustedDeviceToken);
    }
    async verify2FA(req, body) {
        const telemetry = await (0, client_telemetry_util_1.extractFullTelemetry)(req);
        return this.authService.verify2FALogin(body.tempToken, body.code, Boolean(body.rememberDevice), telemetry);
    }
    async switchTenant(req, tenantId) {
        const userId = req.user?.id || req.user?.sub;
        const telemetry = await (0, client_telemetry_util_1.extractFullTelemetry)(req);
        return this.authService.switchTenant(userId, tenantId, telemetry);
    }
    async getActiveSessions(tenantId) {
        return this.sessionService.listActiveSessions(tenantId);
    }
    async getAuditLogs(tenantId) {
        return this.sessionService.listAuditLogs(tenantId);
    }
    async killSession(sessionId) {
        const result = await this.sessionService.killSession(sessionId);
        try {
            if (this.chatGateway?.server) {
                this.chatGateway.server.emit('session_terminated', {
                    sessionId,
                    userId: result.userId,
                    reason: 'Sessão encerrada remotamente pela administração.',
                });
            }
        }
        catch (e) { }
        return result;
    }
    async killAllSessions(req, preserveCurrent = true) {
        const rawToken = req.headers?.authorization?.replace(/^Bearer\s+/i, '') || req.query?.token;
        const result = await this.sessionService.killAllSessions(preserveCurrent ? rawToken : undefined);
        try {
            if (this.chatGateway?.server) {
                this.chatGateway.server.emit('session_terminated', {
                    all: true,
                    exceptToken: preserveCurrent ? rawToken : undefined,
                    reason: 'Todas as conexões foram encerradas por auditoria global de segurança.',
                });
            }
        }
        catch (e) { }
        return result;
    }
    async unlockUser(userId) {
        return this.sessionService.unlockUser(userId);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('verify-2fa'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verify2FA", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('switch-tenant'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "switchTenant", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Get)('admin/sessions'),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getActiveSessions", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Get)('admin/audit-logs'),
    __param(0, (0, common_1.Query)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Post)('admin/kill-session'),
    __param(0, (0, common_1.Body)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "killSession", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Post)('admin/kill-all-sessions'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('preserveCurrent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Boolean]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "killAllSessions", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Post)('admin/unlock-user'),
    __param(0, (0, common_1.Body)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "unlockUser", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __param(2, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        session_service_1.SessionService,
        chat_gateway_1.ChatGateway])
], AuthController);
//# sourceMappingURL=auth.controller.js.map