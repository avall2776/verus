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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/database/prisma.service");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(NotificationsService_1.name);
    }
    async getNotifications(tenantId, userId) {
        try {
            const now = new Date();
            const [user, teamMessages, supportTickets, goals] = await Promise.all([
                this.prisma.user.findUnique({
                    where: { id: userId },
                    select: {
                        id: true,
                        name: true,
                        permissions: true,
                        tenant: {
                            select: {
                                metaPhoneNumberId: true,
                                whatsappSettings: true,
                                emailSettings: true,
                            }
                        }
                    }
                }),
                this.prisma.teamMessage.findMany({
                    where: {
                        tenantId,
                        senderId: { not: userId },
                        OR: [
                            { receiverId: userId },
                            { channelId: { not: null } }
                        ]
                    },
                    take: 15,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        sender: { select: { id: true, name: true } },
                        channel: { select: { id: true, name: true } }
                    }
                }),
                this.prisma.supportTicket.findMany({
                    where: {
                        tenantId,
                    },
                    take: 10,
                    orderBy: { updatedAt: 'desc' },
                    include: {
                        user: { select: { name: true } },
                        messages: {
                            take: 1,
                            orderBy: { createdAt: 'desc' },
                            select: { id: true, content: true, senderName: true, senderRole: true, createdAt: true }
                        }
                    }
                }),
                this.prisma.goal.findMany({
                    where: {
                        tenantId,
                        periodEnd: { gte: now }
                    },
                    take: 5,
                    orderBy: { updatedAt: 'desc' }
                })
            ]);
            const permissions = user?.permissions || {};
            const readNotificationIds = Array.isArray(permissions.readNotificationIds)
                ? permissions.readNotificationIds
                : [];
            const lastReadNotificationsAt = permissions.lastReadNotificationsAt
                ? new Date(permissions.lastReadNotificationsAt).getTime()
                : 0;
            const rawItems = [];
            for (const msg of teamMessages) {
                const id = `chat_${msg.id}`;
                const isChannel = Boolean(msg.channelId && msg.channel);
                const title = isChannel
                    ? `#${msg.channel?.name}: ${msg.sender?.name || 'Colega'}`
                    : `Mensagem de ${msg.sender?.name || 'Colega'}`;
                rawItems.push({
                    id,
                    type: 'CHAT',
                    title,
                    description: msg.content.length > 80 ? `${msg.content.substring(0, 80)}...` : msg.content,
                    createdAt: msg.createdAt.toISOString(),
                    isRead: readNotificationIds.includes(id) || msg.createdAt.getTime() <= lastReadNotificationsAt,
                    link: '/chat-interno',
                    priority: 'NORMAL',
                    metadata: {
                        channelId: msg.channelId,
                        senderId: msg.senderId
                    }
                });
            }
            for (const ticket of supportTickets) {
                const id = `ticket_${ticket.id}_${ticket.status}`;
                const latestMsg = ticket.messages?.[0];
                const statusLabel = ticket.status === 'RESOLVED' ? 'Resolvido' :
                    ticket.status === 'IN_PROGRESS' ? 'Em Atendimento' :
                        ticket.status === 'WAITING_CLIENT' ? 'Aguardando Cliente' : 'Aberto';
                const title = `Chamado #${ticket.ticketNumber || ticket.id.substring(0, 6).toUpperCase()}: ${ticket.subject}`;
                const description = latestMsg
                    ? `${latestMsg.senderName || 'Suporte'}: ${latestMsg.content.substring(0, 75)}...`
                    : `Status atualizado para: ${statusLabel}`;
                const itemTime = latestMsg ? latestMsg.createdAt : ticket.updatedAt;
                rawItems.push({
                    id,
                    type: 'SUPPORT',
                    title,
                    description,
                    createdAt: itemTime.toISOString(),
                    isRead: readNotificationIds.includes(id) || itemTime.getTime() <= lastReadNotificationsAt,
                    link: '/support',
                    priority: ticket.priority === 'URGENT' || ticket.priority === 'HIGH' ? 'HIGH' : 'NORMAL',
                    metadata: {
                        ticketId: ticket.id,
                        status: ticket.status
                    }
                });
            }
            for (const g of goals) {
                const target = Number(g.targetValue || 0);
                const current = Number(g.currentValue || 0);
                const pct = target > 0 ? Math.round((current / target) * 100) : 0;
                const id = `goal_${g.id}_${Math.floor(pct / 25)}`;
                if (pct >= 100) {
                    rawItems.push({
                        id,
                        type: 'GOAL',
                        title: `Meta Atingida! ${g.title}`,
                        description: `Parabéns à equipe! A meta atingiu ${pct}% da meta estabelecida.`,
                        createdAt: g.updatedAt.toISOString(),
                        isRead: readNotificationIds.includes(id) || g.updatedAt.getTime() <= lastReadNotificationsAt,
                        link: '/dashboard/goals',
                        priority: 'HIGH',
                        metadata: { goalId: g.id, pct }
                    });
                }
                else {
                    const diffDays = Math.ceil((g.periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays <= 7 && diffDays >= 0) {
                        rawItems.push({
                            id,
                            type: 'GOAL',
                            title: `Reta Final de Meta: ${g.title}`,
                            description: `Faltam apenas ${diffDays} dias para o fechamento. Atingimento atual: ${pct}%.`,
                            createdAt: g.updatedAt.toISOString(),
                            isRead: readNotificationIds.includes(id) || g.updatedAt.getTime() <= lastReadNotificationsAt,
                            link: '/dashboard/goals',
                            priority: pct < 50 ? 'HIGH' : 'NORMAL',
                            metadata: { goalId: g.id, diffDays, pct }
                        });
                    }
                }
            }
            const isWhatsappActive = Boolean(user?.tenant?.metaPhoneNumberId || user?.tenant?.whatsappSettings);
            const sysNoticeId = 'sys_v24_update';
            const releaseDate = new Date('2026-09-17T08:00:00Z');
            rawItems.push({
                id: sysNoticeId,
                type: 'SYSTEM',
                title: 'Versão 2.4 Lançada com Êxito',
                description: 'Widget de Suporte Versus e Central de Notificações integrados à plataforma.',
                createdAt: releaseDate.toISOString(),
                isRead: readNotificationIds.includes(sysNoticeId) || releaseDate.getTime() <= lastReadNotificationsAt,
                link: '/support',
                priority: 'NORMAL',
                metadata: { version: '2.4' }
            });
            if (!isWhatsappActive) {
                const waNoticeId = 'sys_wa_pending';
                rawItems.push({
                    id: waNoticeId,
                    type: 'SYSTEM',
                    title: 'Conexão WhatsApp Pendente',
                    description: 'Configure a Meta Cloud API para iniciar atendimentos automatizados com IA Vitor.',
                    createdAt: new Date('2026-09-17T07:30:00Z').toISOString(),
                    isRead: readNotificationIds.includes(waNoticeId),
                    link: '/settings/whatsapp',
                    priority: 'HIGH',
                    metadata: { action: 'whatsapp_connect' }
                });
            }
            rawItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const unreadCount = rawItems.filter(n => !n.isRead).length;
            return {
                notifications: rawItems,
                unreadCount
            };
        }
        catch (error) {
            this.logger.error('Erro ao buscar notificações do tenant', error);
            return { notifications: [], unreadCount: 0 };
        }
    }
    async markAllAsRead(tenantId, userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { permissions: true }
        });
        const currentPerms = user?.permissions || {};
        const updatedPerms = {
            ...currentPerms,
            lastReadNotificationsAt: new Date().toISOString(),
            readNotificationIds: []
        };
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                permissions: updatedPerms
            }
        });
        return { success: true, message: 'Todas as notificações foram marcadas como lidas.' };
    }
    async markAsRead(tenantId, userId, notificationId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { permissions: true }
        });
        const currentPerms = user?.permissions || {};
        const readIds = new Set(Array.isArray(currentPerms.readNotificationIds) ? currentPerms.readNotificationIds : []);
        readIds.add(notificationId);
        const updatedPerms = {
            ...currentPerms,
            readNotificationIds: Array.from(readIds)
        };
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                permissions: updatedPerms
            }
        });
        return { success: true, notificationId };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map