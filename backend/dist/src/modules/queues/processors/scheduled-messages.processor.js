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
var ScheduledMessagesProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduledMessagesProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const prisma_service_1 = require("../../../shared/database/prisma.service");
const messaging_service_1 = require("../../messaging/messaging.service");
const chat_gateway_1 = require("../../chat/chat.gateway");
const common_1 = require("@nestjs/common");
let ScheduledMessagesProcessor = ScheduledMessagesProcessor_1 = class ScheduledMessagesProcessor extends bullmq_1.WorkerHost {
    constructor(prisma, messagingService, chatGateway) {
        super();
        this.prisma = prisma;
        this.messagingService = messagingService;
        this.chatGateway = chatGateway;
        this.logger = new common_1.Logger(ScheduledMessagesProcessor_1.name);
    }
    async process(job) {
        const { messageId, tenantId, conversationId } = job.data;
        this.logger.log(`Processando mensagem agendada: ${messageId} para conversa ${conversationId}`);
        try {
            const message = await this.prisma.message.findUnique({
                where: { id: messageId },
                include: {
                    contact: true,
                    conversation: true,
                },
            });
            if (!message) {
                this.logger.warn(`Mensagem agendada ${messageId} não encontrada. Abortando.`);
                return { status: 'not_found' };
            }
            if (message.status !== 'scheduled') {
                this.logger.log(`Mensagem ${messageId} não está mais agendada (status atual: "${message.status}"). Ignorando.`);
                return { status: 'skipped', currentStatus: message.status };
            }
            if (!message.isInternal && message.contact?.phone) {
                if ((message.type === 'image' || message.type === 'document') && message.mediaUrl) {
                    await this.messagingService.sendMedia({
                        tenantId: message.tenantId,
                        phone: message.contact.phone,
                        type: message.type,
                        mediaUrl: message.mediaUrl,
                        content: message.content,
                        filename: message.content?.includes('.') ? message.content : (message.type === 'document' ? 'documento.pdf' : 'imagem.jpg'),
                    });
                }
                else {
                    await this.messagingService.sendText({
                        tenantId: message.tenantId,
                        phone: message.contact.phone,
                        content: message.content,
                    });
                }
            }
            const updatedMessage = await this.prisma.message.update({
                where: { id: messageId },
                data: {
                    status: 'delivered',
                },
            });
            if (message.conversation?.status === 'bot_active' && !message.isInternal) {
                await this.prisma.conversation.update({
                    where: { id: conversationId },
                    data: { status: 'human_takeover' },
                });
            }
            this.chatGateway.emitNewMessage(tenantId, updatedMessage);
            this.chatGateway.emitConversationUpdated(tenantId, {
                id: conversationId,
                updatedAt: new Date(),
            });
            this.logger.log(`Mensagem agendada ${messageId} disparada e entregue com sucesso!`);
            return { status: 'success', messageId };
        }
        catch (error) {
            this.logger.error(`Erro ao disparar mensagem agendada ${messageId}: ${error?.message}`, error?.stack);
            await this.prisma.message.update({
                where: { id: messageId },
                data: { status: 'failed' },
            }).catch(() => null);
            throw error;
        }
    }
};
exports.ScheduledMessagesProcessor = ScheduledMessagesProcessor;
exports.ScheduledMessagesProcessor = ScheduledMessagesProcessor = ScheduledMessagesProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    (0, bullmq_1.Processor)('scheduled-messages'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        messaging_service_1.MessagingService,
        chat_gateway_1.ChatGateway])
], ScheduledMessagesProcessor);
//# sourceMappingURL=scheduled-messages.processor.js.map