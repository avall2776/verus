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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const messaging_service_1 = require("../messaging/messaging.service");
let ChatService = class ChatService {
    constructor(prisma, messagingService) {
        this.prisma = prisma;
        this.messagingService = messagingService;
    }
    async findAllConversations(tenantId, status) {
        const whereClause = { tenantId };
        if (status) {
            whereClause.status = status;
        }
        return this.prisma.conversation.findMany({
            where: whereClause,
            include: {
                contact: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { updatedAt: 'desc' }
        });
    }
    async getConversationMessages(tenantId, conversationId) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada ou não pertence a este tenant.');
        }
        return this.prisma.message.findMany({
            where: { tenantId, conversationId },
            orderBy: { createdAt: 'asc' }
        });
    }
    async takeoverConversation(tenantId, conversationId) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        return this.prisma.conversation.update({
            where: { id: conversationId },
            data: { status: 'human_takeover' }
        });
    }
    async releaseConversation(tenantId, conversationId) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        return this.prisma.conversation.update({
            where: { id: conversationId },
            data: { status: 'resolved' }
        });
    }
    async sendManualMessage(tenantId, conversationId, content) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { contact: true }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        if (conversation.status === 'bot_active') {
            await this.prisma.conversation.update({
                where: { id: conversationId },
                data: { status: 'human_takeover' }
            });
        }
        await this.messagingService.sendText({
            tenantId,
            phone: conversation.contact.phone,
            content,
        });
        return this.prisma.message.create({
            data: {
                tenantId,
                conversationId,
                providerMessageId: `manual_${Date.now()}`,
                contactId: conversation.contactId,
                content,
                direction: 'OUTBOUND',
                senderType: 'user',
                status: 'delivered',
            }
        });
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        messaging_service_1.MessagingService])
], ChatService);
//# sourceMappingURL=chat.service.js.map