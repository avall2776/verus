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
var WebhooksController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let WebhooksController = WebhooksController_1 = class WebhooksController {
    constructor(ingressQueue) {
        this.ingressQueue = ingressQueue;
        this.logger = new common_1.Logger(WebhooksController_1.name);
        this.META_VERIFY_TOKEN = 'versus_secreto_123';
    }
    verifyMetaWebhook(mode, token, challenge, res) {
        if (mode === 'subscribe' && token === this.META_VERIFY_TOKEN) {
            this.logger.log('Webhook Meta verificado com sucesso!');
            return res.status(200).send(challenge);
        }
        return res.sendStatus(403);
    }
    async handleMetaWebhook(tenantId, payload) {
        this.logger.log(`Recebendo POST da Meta para o tenant: ${tenantId}`);
        const entry = payload.entry?.[0];
        const change = entry?.changes?.[0];
        const message = change?.value?.messages?.[0];
        if (!message) {
            return { status: 'ignored', reason: 'Not a message event' };
        }
        await this.ingressQueue.add('process-meta-message', {
            tenantId,
            webhookData: payload,
        }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
            jobId: `msg_${message.id}`
        });
        return { status: 'queued' };
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Get)('meta/:tenantId'),
    __param(0, (0, common_1.Query)('hub.mode')),
    __param(1, (0, common_1.Query)('hub.verify_token')),
    __param(2, (0, common_1.Query)('hub.challenge')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], WebhooksController.prototype, "verifyMetaWebhook", null);
__decorate([
    (0, common_1.Post)('meta/:tenantId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleMetaWebhook", null);
exports.WebhooksController = WebhooksController = WebhooksController_1 = __decorate([
    (0, common_1.Controller)('webhooks'),
    __param(0, (0, bullmq_1.InjectQueue)('webhook-ingress')),
    __metadata("design:paramtypes", [bullmq_2.Queue])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map