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
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const path = require("path");
const fs = require("fs");
const os = require("os");
const child_process_1 = require("child_process");
const util_1 = require("util");
const prisma_service_1 = require("../../shared/database/prisma.service");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const messaging_service_1 = require("../messaging/messaging.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
const chat_gateway_1 = require("./chat.gateway");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let ChatService = ChatService_1 = class ChatService {
    constructor(prisma, messagingService, whatsappService, chatGateway, scheduledQueue) {
        this.prisma = prisma;
        this.messagingService = messagingService;
        this.whatsappService = whatsappService;
        this.chatGateway = chatGateway;
        this.scheduledQueue = scheduledQueue;
        this.logger = new common_1.Logger(ChatService_1.name);
    }
    async getConversationCounts(tenantId, userId, userRole) {
        const isMaster = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
        const [waiting, mine, resolved] = await Promise.all([
            this.prisma.conversation.count({
                where: {
                    tenantId,
                    status: { in: ['waiting', 'bot_active'] },
                    assignedTo: null,
                }
            }),
            this.prisma.conversation.count({
                where: {
                    tenantId,
                    status: { in: ['open', 'human_takeover', 'in_progress'] },
                    ...(isMaster ? {} : { assignedTo: userId }),
                }
            }),
            this.prisma.conversation.count({
                where: {
                    tenantId,
                    status: { in: ['resolved', 'closed'] },
                }
            }),
        ]);
        return { waiting, mine, resolved, total: waiting + mine + resolved };
    }
    async getOperatorProductivity(tenantId, userId) {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const todayResolved = await this.prisma.conversation.findMany({
            where: {
                tenantId,
                assignedTo: userId,
                status: { in: ['resolved', 'closed', 'RESOLVED', 'CLOSED'] },
                updatedAt: { gte: startOfToday, lte: endOfToday },
            },
            include: {
                messages: {
                    select: {
                        createdAt: true,
                        direction: true,
                        isInternal: true,
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        const todayFinishedCount = todayResolved.length;
        let tmaSeconds = 0;
        let firstResponseSeconds = 0;
        if (todayFinishedCount > 0) {
            let totalDurationSeconds = 0;
            let totalFirstRespSeconds = 0;
            let firstRespCount = 0;
            for (const conv of todayResolved) {
                const durationSec = Math.max(0, Math.round((new Date(conv.updatedAt).getTime() - new Date(conv.createdAt).getTime()) / 1000));
                totalDurationSeconds += durationSec;
                const inMsgs = conv.messages.filter(m => m.direction === 'INBOUND' && !m.isInternal);
                const outMsgs = conv.messages.filter(m => m.direction === 'OUTBOUND' && !m.isInternal);
                if (inMsgs.length > 0 && outMsgs.length > 0) {
                    const firstIn = inMsgs[0];
                    const firstOutAfterIn = outMsgs.find(o => new Date(o.createdAt).getTime() >= new Date(firstIn.createdAt).getTime()) || outMsgs[0];
                    const respSec = Math.max(0, Math.round((new Date(firstOutAfterIn.createdAt).getTime() - new Date(firstIn.createdAt).getTime()) / 1000));
                    totalFirstRespSeconds += respSec;
                    firstRespCount++;
                }
                else if (outMsgs.length > 0) {
                    const respSec = Math.max(0, Math.round((new Date(outMsgs[0].createdAt).getTime() - new Date(conv.createdAt).getTime()) / 1000));
                    totalFirstRespSeconds += respSec;
                    firstRespCount++;
                }
            }
            tmaSeconds = Math.round(totalDurationSeconds / todayFinishedCount);
            firstResponseSeconds = firstRespCount > 0 ? Math.round(totalFirstRespSeconds / firstRespCount) : 0;
        }
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const pastResolvedCount = await this.prisma.conversation.count({
            where: {
                tenantId,
                assignedTo: userId,
                status: { in: ['resolved', 'closed', 'RESOLVED', 'CLOSED'] },
                updatedAt: { gte: thirtyDaysAgo, lt: startOfToday },
            },
        });
        const avgDaily = Math.round(pastResolvedCount / 30);
        let finishedVsAveragePercent = 0;
        if (avgDaily > 0) {
            finishedVsAveragePercent = Math.round(((todayFinishedCount - avgDaily) / avgDaily) * 100);
        }
        const userGoal = await this.prisma.goal.findFirst({
            where: {
                tenantId,
                userId,
            },
        });
        const dailyGoal = userGoal?.targetValue ? Math.round(Number(userGoal.targetValue)) : 10;
        const formatDuration = (sec) => {
            if (sec <= 0)
                return '0s';
            if (sec < 60)
                return `${sec}s`;
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            if (m < 60) {
                return s > 0 ? `${m}m ${s}s` : `${m}m`;
            }
            const h = Math.floor(sec / 3600);
            const remM = Math.floor((sec % 3600) / 60);
            return remM > 0 ? `${h}h ${remM}m` : `${h}h`;
        };
        return {
            todayFinishedCount,
            tmaSeconds,
            firstResponseSeconds,
            todayAvgTma: todayFinishedCount > 0 && tmaSeconds > 0 ? formatDuration(tmaSeconds) : '0 min',
            todayFirstResp: todayFinishedCount > 0 && firstResponseSeconds > 0 ? formatDuration(firstResponseSeconds) : '0s',
            avgDaily,
            finishedVsAveragePercent,
            dailyGoal,
        };
    }
    async findAllConversations(tenantId, userId, userRole, tab = 'waiting') {
        const whereClause = { tenantId };
        const isMaster = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
        if (tab === 'all' || tab === 'unread') {
            if (!isMaster && userRole === 'AGENT') {
                const userDepts = await this.prisma.userDepartment.findMany({ where: { userId } });
                const deptIds = userDepts.map(d => d.departmentId);
                whereClause.OR = [
                    { assignedTo: userId },
                    { departmentId: { in: deptIds } },
                    { departmentId: null }
                ];
            }
        }
        else if (tab === 'resolved') {
            whereClause.status = { in: ['resolved', 'closed'] };
        }
        else if (tab === 'mine') {
            whereClause.status = { in: ['open', 'human_takeover', 'in_progress'] };
            if (!isMaster) {
                whereClause.assignedTo = userId;
            }
        }
        else {
            whereClause.status = { in: ['waiting', 'bot_active'] };
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
        const conversations = await this.prisma.conversation.findMany({
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
        for (const conv of conversations) {
            if (conv.contact) {
                const av = conv.contact.avatarUrl;
                if (!av || av === 'null' || av === 'undefined' || av.includes('unsplash.com')) {
                    conv.contact.avatarUrl = null;
                }
                const isGenericName = !conv.contact.name || conv.contact.name === 'Cliente WhatsApp' || conv.contact.name.includes('@lid') || conv.contact.name.startsWith('WhatsApp');
                if (!conv.contact.avatarUrl || isGenericName) {
                    this.whatsappService.syncContactMetadata(tenantId, conv.contact.id).catch(() => { });
                }
            }
        }
        return conversations;
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
    async getConversationByContact(tenantId, contactId) {
        const conversation = await this.prisma.conversation.findFirst({
            where: { tenantId, contactId },
            orderBy: { updatedAt: 'desc' },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                },
                contact: true
            }
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Nenhuma conversa encontrada para este contato.');
        }
        if (conversation.contact) {
            const av = conversation.contact.avatarUrl;
            if (!av || av === 'null' || av === 'undefined' || av.includes('unsplash.com')) {
                conversation.contact.avatarUrl = null;
            }
        }
        return conversation;
    }
    async getConversationById(tenantId, conversationId) {
        const conversation = await this.prisma.conversation.findFirst({
            where: { tenantId, id: conversationId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' }
                },
                contact: true,
                department: true
            }
        });
        if (!conversation) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        if (conversation.contact) {
            const av = conversation.contact.avatarUrl;
            if (!av || av === 'null' || av === 'undefined' || av.includes('unsplash.com')) {
                conversation.contact.avatarUrl = null;
            }
        }
        return conversation;
    }
    async takeoverConversation(tenantId, conversationId, userId) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        const updated = await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { status: 'human_takeover', assignedTo: userId }
        });
        this.chatGateway.emitConversationUpdated(tenantId, updated);
        return updated;
    }
    async releaseConversation(tenantId, conversationId) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        const updated = await this.prisma.conversation.update({
            where: { id: conversationId },
            data: {
                status: 'resolved',
                updatedAt: new Date()
            },
            include: {
                contact: true,
                department: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
        this.chatGateway.emitConversationUpdated(tenantId, updated);
        return updated;
    }
    async reopenConversation(tenantId, conversationId) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        const updated = await this.prisma.conversation.update({
            where: { id: conversationId },
            data: {
                status: 'waiting',
                assignedTo: null,
                updatedAt: new Date()
            },
            include: {
                contact: true,
                department: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
        this.chatGateway.emitConversationUpdated(tenantId, updated);
        return updated;
    }
    async markAsRead(tenantId, conversationId) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        await this.prisma.message.updateMany({
            where: {
                tenantId,
                conversationId,
                direction: 'INBOUND',
                status: { not: 'read' }
            },
            data: { status: 'read' }
        });
        this.chatGateway.emitConversationUpdated(tenantId, { ...conversation, unreadCount: 0 });
        return { success: true, conversationId, unreadCount: 0 };
    }
    async markAsUnread(tenantId, conversationId) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        this.chatGateway.emitConversationUpdated(tenantId, { ...conversation, unreadCount: 1 });
        return { success: true, conversationId, unreadCount: 1 };
    }
    async assignToUser(tenantId, conversationId, userId, operatorName) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { contact: true, department: true }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        const updated = await this.prisma.conversation.update({
            where: { id: conversationId },
            data: { assignedTo: userId, status: 'open' },
            include: {
                contact: true,
                department: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
        this.chatGateway.emitConversationUpdated(tenantId, updated);
        this.chatGateway.emitConversationTransferred(tenantId, {
            conversationId: updated.id,
            contact: updated.contact,
            department: updated.department,
            assignedTo: updated.assignedTo,
            transferredBy: operatorName || 'Um operador',
            action: 'ASSIGNED',
            transferredAt: new Date().toISOString()
        });
        return updated;
    }
    async transferToDepartment(tenantId, conversationId, departmentId, userId, operatorName) {
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
        const updated = await this.prisma.conversation.update({
            where: { id: conversationId },
            data: {
                departmentId,
                status: userId ? 'open' : 'waiting',
                assignedTo: userId || null,
                updatedAt: conversation.updatedAt
            },
            include: {
                contact: true,
                department: true,
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
        this.chatGateway.emitConversationUpdated(tenantId, updated);
        this.chatGateway.emitConversationTransferred(tenantId, {
            conversationId: updated.id,
            contact: updated.contact,
            department: updated.department,
            assignedTo: updated.assignedTo,
            transferredBy: operatorName || 'Um colega',
            action: 'TRANSFERRED',
            transferredAt: new Date().toISOString()
        });
        return updated;
    }
    parseScheduledDate(scheduledAt, timezone) {
        if (!scheduledAt) {
            throw new common_1.BadRequestException('A data e o horário de agendamento são obrigatórios.');
        }
        const dateStr = scheduledAt.trim();
        const hasTimezone = /Z|[+-]\d{2}(:?\d{2})?$/.test(dateStr);
        let parsedDate;
        if (hasTimezone) {
            parsedDate = new Date(dateStr);
        }
        else {
            const offset = timezone === 'UTC' ? 'Z' : '-03:00';
            parsedDate = new Date(`${dateStr}${offset}`);
        }
        if (isNaN(parsedDate.getTime())) {
            throw new common_1.BadRequestException('Formato de data ou horário inválido para agendamento.');
        }
        const now = Date.now();
        if (parsedDate.getTime() <= now + 10000) {
            throw new common_1.BadRequestException('O horário de agendamento deve ser definido para um momento futuro.');
        }
        return parsedDate;
    }
    async scheduleMessage(tenantId, conversationId, payload) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { contact: true }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        if (!payload.content || !payload.content.trim()) {
            throw new common_1.BadRequestException('O conteúdo da mensagem é obrigatório.');
        }
        const scheduledDate = this.parseScheduledDate(payload.scheduledAt, payload.timezone);
        const delayMs = Math.max(0, scheduledDate.getTime() - Date.now());
        const isInternal = payload.isInternal || false;
        const type = payload.type || 'text';
        const mediaUrl = payload.mediaUrl || null;
        const msg = await this.prisma.message.create({
            data: {
                tenantId,
                conversationId,
                providerMessageId: `scheduled_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                contactId: conversation.contactId,
                content: payload.content.trim(),
                type,
                mediaUrl,
                isInternal,
                direction: 'OUTBOUND',
                senderType: 'user',
                status: 'scheduled',
                scheduledAt: scheduledDate,
            }
        });
        await this.scheduledQueue.add('sendScheduledMessage', {
            messageId: msg.id,
            tenantId,
            conversationId,
        }, {
            delay: delayMs,
            jobId: `msg_scheduled_${msg.id}`,
            removeOnComplete: true,
        });
        this.chatGateway.emitNewMessage(tenantId, msg);
        return msg;
    }
    async getScheduledMessages(tenantId, conversationId) {
        return this.prisma.message.findMany({
            where: {
                tenantId,
                conversationId,
                status: 'scheduled',
            },
            orderBy: { scheduledAt: 'asc' }
        });
    }
    async getAllScheduledMessages(tenantId) {
        return this.prisma.message.findMany({
            where: {
                tenantId,
                status: 'scheduled',
            },
            include: {
                contact: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        avatarUrl: true,
                    }
                },
                conversation: {
                    select: {
                        id: true,
                        status: true,
                    }
                }
            },
            orderBy: { scheduledAt: 'asc' }
        });
    }
    async batchCancelScheduledMessages(tenantId, messageIds) {
        if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
            throw new common_1.BadRequestException('Nenhum identificador de mensagem informado.');
        }
        const messages = await this.prisma.message.findMany({
            where: {
                id: { in: messageIds },
                tenantId,
                status: 'scheduled',
            }
        });
        const validIds = messages.map(m => m.id);
        await Promise.all(validIds.map(async (id) => {
            try {
                const job = await this.scheduledQueue.getJob(`msg_scheduled_${id}`);
                if (job)
                    await job.remove();
            }
            catch { }
        }));
        const result = await this.prisma.message.deleteMany({
            where: {
                id: { in: validIds },
                tenantId,
            }
        });
        return {
            success: true,
            canceledCount: result.count,
            canceledIds: validIds,
        };
    }
    async cancelScheduledMessage(tenantId, messageId) {
        const msg = await this.prisma.message.findUnique({
            where: { id: messageId }
        });
        if (!msg || msg.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Mensagem agendada não encontrada.');
        }
        if (msg.status !== 'scheduled') {
            throw new common_1.BadRequestException('Esta mensagem não possui agendamento pendente.');
        }
        try {
            const job = await this.scheduledQueue.getJob(`msg_scheduled_${msg.id}`);
            if (job)
                await job.remove();
        }
        catch {
        }
        await this.prisma.message.delete({
            where: { id: messageId }
        });
        return { success: true, messageId };
    }
    async sendManualMessage(tenantId, conversationId, payload) {
        if (payload.scheduledAt) {
            return this.scheduleMessage(tenantId, conversationId, {
                content: payload.content,
                scheduledAt: payload.scheduledAt,
                timezone: payload.timezone,
                isInternal: payload.isInternal,
                type: payload.type,
                mediaUrl: payload.mediaUrl,
            });
        }
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
        const initialStatus = isInternal ? 'delivered' : 'pending';
        const tempMessageId = `manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        let msg = await this.prisma.message.create({
            data: {
                tenantId,
                conversationId,
                providerMessageId: tempMessageId,
                contactId: conversation.contactId,
                content: payload.content,
                type,
                mediaUrl,
                isInternal,
                direction: 'OUTBOUND',
                senderType: 'user',
                status: initialStatus,
            }
        });
        if (!isInternal && conversation.contact?.phone) {
            try {
                let sendRes = null;
                if ((type === 'image' || type === 'document') && mediaUrl) {
                    sendRes = await this.messagingService.sendMedia({
                        tenantId,
                        phone: conversation.contact.phone,
                        type,
                        mediaUrl,
                        content: payload.content,
                        filename: payload.content?.includes('.') ? payload.content : (type === 'document' ? 'documento.pdf' : 'imagem.jpg'),
                        instanceId: payload.instanceId,
                    });
                }
                else {
                    sendRes = await this.messagingService.sendText({
                        tenantId,
                        phone: conversation.contact.phone,
                        content: payload.content,
                        instanceId: payload.instanceId,
                    });
                }
                if (sendRes?.success) {
                    const finalStatus = 'sent';
                    msg = await this.prisma.message.update({
                        where: { id: msg.id },
                        data: {
                            providerMessageId: sendRes.messageId || msg.providerMessageId,
                            status: finalStatus,
                        },
                    });
                    this.chatGateway.emitMessageStatusUpdated(tenantId, {
                        messageId: msg.id,
                        providerMessageId: msg.providerMessageId,
                        status: finalStatus,
                        conversationId,
                    });
                }
                else {
                    this.logger.error(`Falha no envio da mensagem ${msg.id} para ${conversation.contact.phone}: ${sendRes?.error}`);
                    msg = await this.prisma.message.update({
                        where: { id: msg.id },
                        data: { status: 'failed' },
                    });
                    this.chatGateway.emitMessageStatusUpdated(tenantId, {
                        messageId: msg.id,
                        providerMessageId: msg.providerMessageId,
                        status: 'failed',
                        conversationId,
                    });
                }
            }
            catch (err) {
                this.logger.error(`Exceção ao disparar mensagem WhatsApp: ${err.message}`);
                msg = await this.prisma.message.update({
                    where: { id: msg.id },
                    data: { status: 'failed' },
                });
                this.chatGateway.emitMessageStatusUpdated(tenantId, {
                    messageId: msg.id,
                    providerMessageId: msg.providerMessageId,
                    status: 'failed',
                    conversationId,
                });
            }
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
    async sendManualMessageToContact(tenantId, contactId, payload, userId) {
        let conversation = await this.prisma.conversation.findFirst({
            where: { tenantId, contactId },
            orderBy: { updatedAt: 'desc' }
        });
        if (!conversation) {
            conversation = await this.prisma.conversation.create({
                data: {
                    tenantId,
                    contactId,
                    status: 'human_takeover',
                    assignedTo: userId
                }
            });
        }
        return this.sendManualMessage(tenantId, conversation.id, payload);
    }
    async sendManualAudioMessage(tenantId, conversationId, file, payload) {
        const conversation = await this.prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { contact: true }
        });
        if (!conversation || conversation.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Conversa não encontrada.');
        }
        const isInternal = payload.isInternal || false;
        let finalBuffer = file.buffer;
        let finalMimeType = 'audio/ogg';
        let ext = 'ogg';
        const tempInput = path.join(os.tmpdir(), `input_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.webm`);
        const tempOutput = path.join(os.tmpdir(), `output_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.ogg`);
        try {
            await fs.promises.writeFile(tempInput, file.buffer);
            await execAsync(`ffmpeg -y -i "${tempInput}" -c:a libopus -b:a 32k -ac 1 -ar 24000 -vn "${tempOutput}"`);
            finalBuffer = await fs.promises.readFile(tempOutput);
            finalMimeType = 'audio/ogg';
            ext = 'ogg';
        }
        catch (ffmpegErr) {
            finalBuffer = file.buffer;
            finalMimeType = file.mimetype || 'audio/webm';
            ext = file.mimetype?.includes('ogg') ? 'ogg' : 'webm';
        }
        finally {
            try {
                if (fs.existsSync(tempInput))
                    await fs.promises.unlink(tempInput);
            }
            catch (e) { }
            try {
                if (fs.existsSync(tempOutput))
                    await fs.promises.unlink(tempOutput);
            }
            catch (e) { }
        }
        const filename = `audio_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const uploadDir = path.join(process.cwd(), 'uploads', 'audio');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        const filePath = path.join(uploadDir, filename);
        await fs.promises.writeFile(filePath, finalBuffer);
        const mediaUrl = `/api-backend/media/audio/${filename}`;
        const initialStatus = isInternal ? 'delivered' : 'pending';
        const tempMessageId = `audio_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        let msg = await this.prisma.message.create({
            data: {
                tenantId,
                conversationId,
                providerMessageId: tempMessageId,
                contactId: conversation.contactId,
                content: payload.content || '🎤 Mensagem de voz',
                type: 'audio',
                mediaUrl,
                isInternal,
                direction: 'OUTBOUND',
                senderType: 'user',
                status: initialStatus,
            }
        });
        if (!isInternal && conversation.contact?.phone) {
            try {
                const sendRes = await this.messagingService.sendAudio({
                    tenantId,
                    phone: conversation.contact.phone,
                    audioBuffer: finalBuffer,
                    audioUrl: mediaUrl,
                    mimeType: finalMimeType,
                    instanceId: payload.instanceId,
                });
                if (sendRes?.success) {
                    const finalStatus = 'sent';
                    msg = await this.prisma.message.update({
                        where: { id: msg.id },
                        data: {
                            providerMessageId: sendRes.messageId || msg.providerMessageId,
                            status: finalStatus,
                        },
                    });
                    this.chatGateway.emitMessageStatusUpdated(tenantId, {
                        messageId: msg.id,
                        providerMessageId: msg.providerMessageId,
                        status: finalStatus,
                        conversationId,
                    });
                }
                else {
                    this.logger.error(`Falha no envio de áudio ${msg.id} para ${conversation.contact.phone}: ${sendRes?.error}`);
                    msg = await this.prisma.message.update({
                        where: { id: msg.id },
                        data: { status: 'failed' },
                    });
                    this.chatGateway.emitMessageStatusUpdated(tenantId, {
                        messageId: msg.id,
                        providerMessageId: msg.providerMessageId,
                        status: 'failed',
                        conversationId,
                    });
                }
            }
            catch (err) {
                this.logger.error(`Exceção ao disparar áudio WhatsApp: ${err.message}`);
                msg = await this.prisma.message.update({
                    where: { id: msg.id },
                    data: { status: 'failed' },
                });
                this.chatGateway.emitMessageStatusUpdated(tenantId, {
                    messageId: msg.id,
                    providerMessageId: msg.providerMessageId,
                    status: 'failed',
                    conversationId,
                });
            }
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
    async deleteMessage(tenantId, conversationId, messageId) {
        const message = await this.prisma.message.findFirst({
            where: { id: messageId, conversationId, tenantId },
            include: {
                contact: true,
            },
        });
        if (!message) {
            throw new common_1.NotFoundException('Mensagem não encontrada');
        }
        if (message.direction === 'OUTBOUND' && message.providerMessageId && !message.providerMessageId.startsWith('fallback_')) {
            try {
                const instances = await this.prisma.whatsAppInstance.findMany({
                    where: { tenantId },
                    orderBy: { isDefault: 'desc' },
                });
                const activeInst = instances.find(i => i.status === 'connected') || instances[0];
                if (activeInst) {
                    const set = activeInst.settings || {};
                    const instanceName = set.instanceName || activeInst.name || this.whatsappService.getSanitizedInstanceName(tenantId, activeInst.id);
                    const targetJid = message.contact.phone;
                    await this.whatsappService.deleteMessageForEveryone(tenantId, instanceName, targetJid, message.providerMessageId);
                }
            }
            catch (err) {
                this.logger.warn(`Erro ao deletar mensagem no WhatsApp Evolution: ${err.message}`);
            }
        }
        await this.prisma.message.delete({
            where: { id: message.id },
        });
        this.chatGateway.emitMessageDeleted(tenantId, {
            conversationId,
            messageId: message.id,
        });
        this.logger.log(`Mensagem [${message.id}] apagada com sucesso na conversa [${conversationId}]`);
        return { success: true, messageId: message.id };
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, bullmq_1.InjectQueue)('scheduled-messages')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        messaging_service_1.MessagingService,
        whatsapp_service_1.WhatsappService,
        chat_gateway_1.ChatGateway,
        bullmq_2.Queue])
], ChatService);
//# sourceMappingURL=chat.service.js.map