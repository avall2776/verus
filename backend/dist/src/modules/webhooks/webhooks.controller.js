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
const prisma_service_1 = require("../../shared/database/prisma.service");
const chat_gateway_1 = require("../chat/chat.gateway");
let WebhooksController = WebhooksController_1 = class WebhooksController {
    constructor(ingressQueue, prisma, chatGateway) {
        this.ingressQueue = ingressQueue;
        this.prisma = prisma;
        this.chatGateway = chatGateway;
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
        const value = change?.value;
        const statuses = value?.statuses;
        if (statuses && Array.isArray(statuses) && statuses.length > 0) {
            for (const st of statuses) {
                const externalId = st.id;
                const rawStatus = st.status;
                let mappedStatus = rawStatus;
                if (st.errors && st.errors.length > 0) {
                    mappedStatus = 'failed';
                    this.logger.error(`Erro retornado pela Meta para a mensagem ${externalId}: ${JSON.stringify(st.errors)}`);
                }
                try {
                    const msg = await this.prisma.message.findFirst({
                        where: {
                            tenantId,
                            providerMessageId: externalId,
                        },
                    });
                    if (msg) {
                        const statusWeight = {
                            pending: 1,
                            sent: 2,
                            delivered: 3,
                            read: 4,
                            failed: 5,
                        };
                        const currentWeight = statusWeight[msg.status] || 0;
                        const newWeight = statusWeight[mappedStatus] || 0;
                        if (newWeight >= currentWeight || mappedStatus === 'failed') {
                            await this.prisma.message.update({
                                where: { id: msg.id },
                                data: { status: mappedStatus },
                            });
                            this.chatGateway.emitMessageStatusUpdated(tenantId, {
                                messageId: msg.id,
                                providerMessageId: externalId,
                                status: mappedStatus,
                                conversationId: msg.conversationId,
                            });
                            this.logger.log(`Status Meta atualizado: msg [${msg.id}] -> ${mappedStatus}`);
                        }
                    }
                }
                catch (statusErr) {
                    this.logger.error(`Erro ao atualizar status Meta da mensagem ${externalId}: ${statusErr.message}`);
                }
            }
            return { status: 'statuses_processed' };
        }
        const message = value?.messages?.[0];
        if (!message) {
            return { status: 'ignored', reason: 'Not a message or status event' };
        }
        await this.ingressQueue.add('process-meta-message', {
            tenantId,
            webhookData: payload,
        }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
            jobId: `msg_${message.id}`,
        });
        return { status: 'queued' };
    }
    async handleEvolutionWebhookDefault(payload) {
        const defaultTenant = await this.prisma.tenant.findFirst({
            orderBy: { createdAt: 'asc' },
            select: { id: true },
        });
        const tenantId = defaultTenant?.id || 'tenant_123';
        return this.handleEvolutionWebhook(tenantId, payload);
    }
    async handleEvolutionWebhook(tenantId, payload) {
        const event = payload.event;
        this.logger.log(`Recebendo webhook Evolution API [${event}] para tenant: ${tenantId}`);
        if (event === 'messages.update' || event === 'MESSAGES_UPDATE') {
            const updates = Array.isArray(payload.data) ? payload.data : [payload.data];
            for (const item of updates) {
                const keyId = item?.key?.id || item?.id;
                const rawStatus = item?.update?.status || item?.status;
                if (!keyId || !rawStatus)
                    continue;
                let mappedStatus = 'sent';
                const s = String(rawStatus).toUpperCase();
                if (s.includes('READ') || s.includes('PLAYED')) {
                    mappedStatus = 'read';
                }
                else if (s.includes('DELIVERY') || s.includes('DELIVERED')) {
                    mappedStatus = 'delivered';
                }
                else if (s.includes('SERVER') || s.includes('SENT') || s.includes('RECEIPT')) {
                    mappedStatus = 'sent';
                }
                else if (s.includes('ERROR') || s.includes('FAIL')) {
                    mappedStatus = 'failed';
                }
                try {
                    const msg = await this.prisma.message.findFirst({
                        where: {
                            tenantId,
                            providerMessageId: keyId,
                        },
                    });
                    if (msg) {
                        const statusWeight = {
                            pending: 1,
                            sent: 2,
                            delivered: 3,
                            read: 4,
                            failed: 5,
                        };
                        const currentWeight = statusWeight[msg.status] || 0;
                        const newWeight = statusWeight[mappedStatus] || 0;
                        if (newWeight >= currentWeight || mappedStatus === 'failed') {
                            await this.prisma.message.update({
                                where: { id: msg.id },
                                data: { status: mappedStatus },
                            });
                            this.chatGateway.emitMessageStatusUpdated(tenantId, {
                                messageId: msg.id,
                                providerMessageId: keyId,
                                status: mappedStatus,
                                conversationId: msg.conversationId,
                            });
                            this.logger.log(`Status Evolution atualizado: msg [${msg.id}] -> ${mappedStatus}`);
                        }
                    }
                }
                catch (err) {
                    this.logger.error(`Erro ao atualizar status Evolution da mensagem ${keyId}: ${err.message}`);
                }
            }
            return { status: 'evolution_status_processed' };
        }
        if (event === 'send.message' || event === 'SEND_MESSAGE') {
            const keyId = payload.data?.key?.id;
            if (keyId) {
                try {
                    const msg = await this.prisma.message.findFirst({
                        where: { tenantId, providerMessageId: keyId },
                    });
                    if (msg && msg.status === 'pending') {
                        await this.prisma.message.update({
                            where: { id: msg.id },
                            data: { status: 'sent' },
                        });
                        this.chatGateway.emitMessageStatusUpdated(tenantId, {
                            messageId: msg.id,
                            providerMessageId: keyId,
                            status: 'sent',
                            conversationId: msg.conversationId,
                        });
                    }
                }
                catch (e) { }
            }
            return { status: 'evolution_send_processed' };
        }
        if (event === 'messages.upsert' || event === 'MESSAGES_UPSERT') {
            const data = payload.data;
            const messageObj = data?.message;
            const key = data?.key;
            if (!key || key.fromMe) {
                return { status: 'ignored_outbound' };
            }
            const remoteJid = (key.remoteJid || '').replace('@s.whatsapp.net', '');
            const textBody = messageObj?.conversation ||
                messageObj?.extendedTextMessage?.text ||
                '';
            const normalizedPayload = {
                entry: [
                    {
                        changes: [
                            {
                                value: {
                                    messaging_product: 'whatsapp',
                                    contacts: [
                                        {
                                            profile: { name: data.pushName || remoteJid },
                                            wa_id: remoteJid,
                                        },
                                    ],
                                    messages: [
                                        {
                                            from: remoteJid,
                                            id: key.id,
                                            timestamp: String(data.messageTimestamp || Math.floor(Date.now() / 1000)),
                                            type: messageObj?.imageMessage ? 'image' : messageObj?.audioMessage ? 'audio' : 'text',
                                            text: textBody ? { body: textBody } : undefined,
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                ],
            };
            await this.ingressQueue.add('process-meta-message', {
                tenantId,
                webhookData: normalizedPayload,
            }, {
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
                jobId: `msg_${key.id}`,
            });
            return { status: 'queued' };
        }
        return { status: 'ignored_unhandled_event' };
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
__decorate([
    (0, common_1.Post)('evolution'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleEvolutionWebhookDefault", null);
__decorate([
    (0, common_1.Post)('evolution/:tenantId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleEvolutionWebhook", null);
exports.WebhooksController = WebhooksController = WebhooksController_1 = __decorate([
    (0, common_1.Controller)('webhooks'),
    __param(0, (0, bullmq_1.InjectQueue)('webhook-ingress')),
    __metadata("design:paramtypes", [bullmq_2.Queue,
        prisma_service_1.PrismaService,
        chat_gateway_1.ChatGateway])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map