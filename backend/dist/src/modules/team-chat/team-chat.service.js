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
exports.TeamChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
const chat_gateway_1 = require("../chat/chat.gateway");
let TeamChatService = class TeamChatService {
    constructor(prisma, chatGateway) {
        this.prisma = prisma;
        this.chatGateway = chatGateway;
    }
    async getUsers(tenantId, currentUserId) {
        const users = await this.prisma.user.findMany({
            where: { tenantId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isOnline: true,
                departments: {
                    include: {
                        department: {
                            select: { id: true, name: true, color: true }
                        }
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
        const userIds = users.map(u => u.id);
        const lastMessages = await Promise.all(userIds.map(async (uid) => {
            if (!currentUserId || uid === currentUserId) {
                return this.prisma.teamMessage.findFirst({
                    where: {
                        tenantId,
                        channelId: null,
                        OR: [{ senderId: uid }, { receiverId: uid }]
                    },
                    orderBy: { createdAt: 'desc' },
                    select: { id: true, content: true, createdAt: true, senderId: true }
                });
            }
            return this.prisma.teamMessage.findFirst({
                where: {
                    tenantId,
                    channelId: null,
                    OR: [
                        { senderId: currentUserId, receiverId: uid },
                        { senderId: uid, receiverId: currentUserId }
                    ]
                },
                orderBy: { createdAt: 'desc' },
                select: { id: true, content: true, createdAt: true, senderId: true }
            });
        }));
        return users.map((user, idx) => ({
            ...user,
            department: user.departments?.[0]?.department?.name || null,
            departmentColor: user.departments?.[0]?.department?.color || null,
            lastMessage: lastMessages[idx] || null
        }));
    }
    async getChannels(tenantId) {
        const channels = await this.prisma.teamChannel.findMany({
            where: { tenantId },
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        content: true,
                        createdAt: true,
                        sender: { select: { id: true, name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        return channels.map(c => ({
            ...c,
            lastMessage: c.messages?.[0] || null
        }));
    }
    async getDepartments(tenantId) {
        return this.prisma.department.findMany({
            where: { tenantId },
            select: { id: true, name: true, color: true },
            orderBy: { name: 'asc' }
        });
    }
    async createChannel(tenantId, data) {
        if (!data.name)
            throw new common_1.BadRequestException("Nome do canal é obrigatório.");
        return this.prisma.teamChannel.create({
            data: {
                tenantId,
                name: data.name,
                description: data.description,
                isPrivate: data.isPrivate || false
            }
        });
    }
    async getMessages(tenantId, currentUserId, channelId, receiverId) {
        if (channelId) {
            return this.prisma.teamMessage.findMany({
                where: { tenantId, channelId },
                include: { sender: { select: { id: true, name: true, role: true } } },
                orderBy: { createdAt: 'asc' }
            });
        }
        if (receiverId) {
            return this.prisma.teamMessage.findMany({
                where: {
                    tenantId,
                    channelId: null,
                    OR: [
                        { senderId: currentUserId, receiverId: receiverId },
                        { senderId: receiverId, receiverId: currentUserId }
                    ]
                },
                include: { sender: { select: { id: true, name: true, role: true } } },
                orderBy: { createdAt: 'asc' }
            });
        }
        return [];
    }
    async sendMessage(tenantId, senderId, data) {
        if (!data.content || !data.content.trim())
            throw new common_1.BadRequestException("Conteúdo vazio.");
        if (!data.channelId && !data.receiverId)
            throw new common_1.BadRequestException("Destino inválido.");
        const message = await this.prisma.teamMessage.create({
            data: {
                tenantId,
                senderId,
                channelId: data.channelId || null,
                receiverId: data.receiverId || null,
                content: data.content.trim(),
                mediaUrl: data.mediaUrl || null
            },
            include: {
                sender: { select: { id: true, name: true, role: true } },
                receiver: { select: { id: true, name: true } },
                channel: { select: { id: true, name: true } }
            }
        });
        this.chatGateway.emitNewTeamMessage(tenantId, message);
        return message;
    }
};
exports.TeamChatService = TeamChatService;
exports.TeamChatService = TeamChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        chat_gateway_1.ChatGateway])
], TeamChatService);
//# sourceMappingURL=team-chat.service.js.map