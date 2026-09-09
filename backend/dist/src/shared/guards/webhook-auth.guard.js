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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let WebhookAuthGuard = class WebhookAuthGuard {
    constructor(configService) {
        this.configService = configService;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const providedSecret = request.headers['x-webhook-secret'];
        const expectedSecret = this.configService.get('WEBHOOK_SECRET');
        if (!expectedSecret) {
            throw new common_1.UnauthorizedException('Servidor não configurado para aceitar webhooks com segurança.');
        }
        if (providedSecret !== expectedSecret) {
            throw new common_1.UnauthorizedException('Falha de autenticação do Webhook.');
        }
        return true;
    }
};
exports.WebhookAuthGuard = WebhookAuthGuard;
exports.WebhookAuthGuard = WebhookAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WebhookAuthGuard);
//# sourceMappingURL=webhook-auth.guard.js.map