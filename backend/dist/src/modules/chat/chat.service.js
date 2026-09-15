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
let ChatService = class ChatService {
    constructor(prisma, messagingService, whatsappService, chatGateway, scheduledQueue) {
        this.prisma = prisma;
        this.messagingService = messagingService;
        this.whatsappService = whatsappService;
        this.chatGateway = chatGateway;
        this.scheduledQueue = scheduledQueue;
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
    async findAllConversations(tenantId, userId, userRole, tab = 'waiting') {
        const whereClause = { tenantId };
        const isMaster = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
        if (tab === 'resolved') {
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
    async transferToDepartment(tenantId, conversationId, departmentId, userId) {
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
        if (!isInternal && conversation.contact?.phone) {
            if ((type === 'image' || type === 'document') && mediaUrl) {
                await this.messagingService.sendMedia({
                    tenantId,
                    phone: conversation.contact.phone,
                    type,
                    mediaUrl,
                    content: payload.content,
                    filename: payload.content?.includes('.') ? payload.content : (type === 'document' ? 'documento.pdf' : 'imagem.jpg'),
                });
            }
            else {
                await this.messagingService.sendText({
                    tenantId,
                    phone: conversation.contact.phone,
                    content: payload.content,
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
        const msg = await this.prisma.message.create({
            data: {
                tenantId,
                conversationId,
                providerMessageId: `audio_${Date.now()}`,
                contactId: conversation.contactId,
                content: payload.content || '🎤 Mensagem de voz',
                type: 'audio',
                mediaUrl,
                isInternal,
                direction: 'OUTBOUND',
                senderType: 'user',
                status: 'delivered',
            }
        });
        if (!isInternal && conversation.contact?.phone) {
            await this.messagingService.sendAudio({
                tenantId,
                phone: conversation.contact.phone,
                audioBuffer: finalBuffer,
                audioUrl: mediaUrl,
                mimeType: finalMimeType,
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
    __param(4, (0, bullmq_1.InjectQueue)('scheduled-messages')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        messaging_service_1.MessagingService,
        whatsapp_service_1.WhatsappService,
        chat_gateway_1.ChatGateway,
        bullmq_2.Queue])
], ChatService);
//# sourceMappingURL=chat.service.js.map