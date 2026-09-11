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
    async getUsers(tenantId) {
        return this.prisma.user.findMany({
            where: { tenantId },
            select: { id: true, name: true, role: true, isOnline: true },
            orderBy: { name: 'asc' }
        });
    }
    async getChannels(tenantId) {
        return this.prisma.teamChannel.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'asc' }
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
                include: { sender: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'asc' }
            });
        }
        if (receiverId) {
            return this.prisma.teamMessage.findMany({
                where: {
                    tenantId,
                    OR: [
                        { senderId: currentUserId, receiverId: receiverId },
                        { senderId: receiverId, receiverId: currentUserId }
                    ]
                },
                include: { sender: { select: { id: true, name: true } } },
                orderBy: { createdAt: 'asc' }
            });
        }
        return [];
    }
    async sendMessage(tenantId, senderId, data) {
        if (!data.content)
            throw new common_1.BadRequestException("Conteúdo vazio.");
        if (!data.channelId && !data.receiverId)
            throw new common_1.BadRequestException("Destino inválido.");
        const message = await this.prisma.teamMessage.create({
            data: {
                tenantId,
                senderId,
                channelId: data.channelId,
                receiverId: data.receiverId,
                content: data.content,
                mediaUrl: data.mediaUrl
            },
            include: {
                sender: { select: { id: true, name: true } }
            }
        });
        this.chatGateway.server.to(tenantId).emit('newTeamMessage', message);
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