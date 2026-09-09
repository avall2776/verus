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
var WebhookProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../shared/database/prisma.service");
const chat_gateway_1 = require("../../chat/chat.gateway");
let WebhookProcessor = WebhookProcessor_1 = class WebhookProcessor extends bullmq_1.WorkerHost {
    constructor(prisma, aiQueue, chatGateway) {
        super();
        this.prisma = prisma;
        this.aiQueue = aiQueue;
        this.chatGateway = chatGateway;
        this.logger = new common_1.Logger(WebhookProcessor_1.name);
    }
    async process(job) {
        const { tenantId, webhookData } = job.data;
        const entry = webhookData.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;
        const message = value?.messages?.[0];
        const contactInfo = value?.contacts?.[0];
        if (!message)
            return { status: 'ignored' };
        const messageId = message.id;
        const remoteJid = message.from;
        const fromMe = false;
        const pushName = contactInfo?.profile?.name || remoteJid;
        this.logger.debug(`Processando job [${job.id}] - Mensagem de ${remoteJid} (Tenant: ${tenantId})`);
        const existingMessage = await this.prisma.message.findUnique({
            where: {
                tenantId_providerMessageId: {
                    tenantId,
                    providerMessageId: messageId,
                }
            }
        });
        if (existingMessage) {
            this.logger.warn(`Mensagem [${messageId}] já processada. Ignorando.`);
            return { status: 'ignored_duplicate' };
        }
        let content = message.text?.body || '[Mídia Não Suportada na Simulação]';
        let mediaType = message.type;
        const phone = remoteJid;
        const contact = await this.prisma.contact.upsert({
            where: {
                tenantId_phone: {
                    tenantId,
                    phone,
                }
            },
            create: {
                tenantId,
                phone,
                name: pushName,
                source: 'WhatsApp',
            },
            update: {
                name: pushName
            }
        });
        let conversation = await this.prisma.conversation.findFirst({
            where: {
                tenantId,
                contactId: contact.id,
                status: { not: 'resolved' }
            }
        });
        if (!conversation) {
            conversation = await this.prisma.conversation.create({
                data: {
                    tenantId,
                    contactId: contact.id,
                    status: 'bot_active',
                }
            });
        }
        const savedMessage = await this.prisma.message.create({
            data: {
                tenantId,
                conversationId: conversation.id,
                contactId: contact.id,
                providerMessageId: messageId,
                direction: 'INBOUND',
                content,
                senderType: 'contact',
                status: 'delivered',
            }
        });
        this.logger.log(`Mensagem [${messageId}] salva com sucesso na conversa [${conversation.id}]`);
        this.chatGateway.emitNewMessage(tenantId, {
            ...savedMessage,
            contact: { phone: contact.phone, name: contact.name }
        });
        if (conversation.status === 'bot_active') {
            await this.aiQueue.add('generate-reply', {
                tenantId,
                conversationId: conversation.id,
                contactId: contact.id,
            }, { attempts: 2, backoff: { type: 'fixed', delay: 2000 } });
            this.logger.log(`Conversa [${conversation.id}] encaminhada para processamento de IA.`);
        }
        else {
            this.logger.log(`Conversa [${conversation.id}] ignorada pela IA. O status atual é Humano (${conversation.status}).`);
        }
        return { status: 'success', messageId: savedMessage.id };
    }
};
exports.WebhookProcessor = WebhookProcessor;
exports.WebhookProcessor = WebhookProcessor = WebhookProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('webhook-ingress'),
    __param(1, (0, bullmq_1.InjectQueue)('ai-processing')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bullmq_2.Queue,
        chat_gateway_1.ChatGateway])
], WebhookProcessor);
//# sourceMappingURL=webhook.processor.js.map