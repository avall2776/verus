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
const chat_gateway_1 = require("./chat.gateway");
let ChatService = class ChatService {
    constructor(prisma, messagingService, chatGateway) {
        this.prisma = prisma;
        this.messagingService = messagingService;
        this.chatGateway = chatGateway;
    }
    async findAllConversations(tenantId, userId, userRole, tab = 'waiting') {
        const whereClause = { tenantId };
        if (tab === 'resolved') {
            whereClause.status = 'resolved';
        }
        else if (tab === 'mine') {
            whereClause.status = { not: 'resolved' };
            whereClause.assignedTo = userId;
        }
        else {
            whereClause.status = { not: 'resolved' };
            whereClause.assignedTo = null;
            if (userRole === 'AGENT') {
                const userDepts = await this.prisma.userDepartment.findMany({ where: { userId } });
                const deptIds = userDepts.map(d => d.departmentId);
                whereClause.OR = [
                    { departmentId: { in: deptIds } },
                    { departmentId: null }
                ];
            }
        }
        return this.prisma.conversation.findMany({
            where: whereClause,
            include: {
                contact: true,
                department: true,
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
    async takeoverConversation(tenantId, conversationId, userId) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        return this.prisma.conversation.update({
            where: { id: conversationId },
            data: { status: 'human_takeover', assignedTo: userId }
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
    async assignToUser(tenantId, conversationId, userId) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        return this.prisma.conversation.update({
            where: { id: conversationId },
            data: { assignedTo: userId, status: 'open' }
        });
    }
    async transferToDepartment(tenantId, conversationId, departmentId) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        const dept = await this.prisma.department.findUnique({
            where: { id: departmentId }
        });
        if (!dept || dept.tenantId !== tenantId)
            throw new common_1.NotFoundException('Departamento inválido.');
        const onlineAgents = await this.prisma.userDepartment.findMany({
            where: { departmentId, user: { isOnline: true } },
            include: { user: true }
        });
        if (onlineAgents.length === 0) {
            return this.prisma.conversation.update({
                where: { id: conversationId },
                data: { departmentId, status: 'waiting', assignedTo: null }
            });
        }
        let selectedUserId = onlineAgents[0].userId;
        let minLoad = Infinity;
        for (const agent of onlineAgents) {
            const activeCount = await this.prisma.conversation.count({
                where: { assignedTo: agent.userId, status: 'human_takeover' }
            });
            if (activeCount < minLoad) {
                minLoad = activeCount;
                selectedUserId = agent.userId;
            }
        }
        return this.prisma.conversation.update({
            where: { id: conversationId },
            data: { departmentId, status: 'human_takeover', assignedTo: selectedUserId }
        });
    }
    async sendManualMessage(tenantId, conversationId, payload) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { contact: true }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        const isInternal = payload.isInternal || false;
        const type = payload.type || 'text';
        const mediaUrl = payload.mediaUrl || null;
        const msg = await this.prisma.message.create({
            data: {
                tenantId,
                conversationId,
                providerMessageId: `manual_${Date.now()}`,
                contactId: conversation.contactId,
                content: payload.content,
                type,
                mediaUrl,
                isInternal,
                direction: 'OUTBOUND',
                senderType: 'user',
                status: 'delivered',
            }
        });
        if (!isInternal) {
            await this.messagingService.sendText({
                tenantId,
                phone: conversation.contact.phone,
                content: payload.content,
            });
        }
        if (conversation.status === 'bot_active' && !isInternal) {
            await this.prisma.conversation.update({
                where: { id: conversationId },
                data: { status: 'human_takeover' }
            });
        }
        this.chatGateway.emitNewMessage(tenantId, msg);
        return msg;
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        messaging_service_1.MessagingService,
        chat_gateway_1.ChatGateway])
], ChatService);
//# sourceMappingURL=chat.service.js.map