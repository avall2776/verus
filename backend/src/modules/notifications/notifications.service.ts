import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

export interface NotificationItem {
  id: string;
  type: 'CHAT' | 'SUPPORT' | 'GOAL' | 'SYSTEM';
  title: string;
  description: string;
  createdAt: string;
  isRead: boolean;
  link?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH';
  metadata?: any;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca e consolida as notificações em tempo real do Tenant e do Usuário
   */
  async getNotifications(tenantId: string, userId: string): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
    try {
      // 1. Busca dados do usuário para verificar preferências de leitura
      const user = await this.prisma.user.findUnique({
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
      });

      const permissions = (user?.permissions as any) || {};
      const readNotificationIds: string[] = Array.isArray(permissions.readNotificationIds)
        ? permissions.readNotificationIds
        : [];
      const lastReadNotificationsAt = permissions.lastReadNotificationsAt
        ? new Date(permissions.lastReadNotificationsAt).getTime()
        : 0;

      const rawItems: NotificationItem[] = [];

      // 2. Notificações do Chat Interno (TeamMessage)
      const teamMessages = await this.prisma.teamMessage.findMany({
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
      });

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

      // 3. Notificações de Chamados de Suporte (SupportTicket)
      const supportTickets = await this.prisma.supportTicket.findMany({
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
      });

      for (const ticket of supportTickets) {
        const id = `ticket_${ticket.id}_${ticket.status}`;
        const latestMsg = ticket.messages?.[0];
        const statusLabel = 
          ticket.status === 'RESOLVED' ? 'Resolvido' :
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

      // 4. Alertas de Metas Comerciais (Goal)
      const now = new Date();
      const goals = await this.prisma.goal.findMany({
        where: {
          tenantId,
          periodEnd: { gte: now }
        },
        take: 5,
        orderBy: { updatedAt: 'desc' }
      });

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
        } else {
          // Dias restantes para encerramento do ciclo
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

      // 5. Avisos Globais do Sistema
      const isWhatsappActive = Boolean(user?.tenant?.metaPhoneNumberId || user?.tenant?.whatsappSettings);
      const isEmailActive = Boolean(user?.tenant?.emailSettings);

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

      // Ordena decrescente por data de criação
      rawItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Contagem de não lidas
      const unreadCount = rawItems.filter(n => !n.isRead).length;

      return {
        notifications: rawItems,
        unreadCount
      };
    } catch (error) {
      this.logger.error('Erro ao buscar notificações do tenant', error);
      return { notifications: [], unreadCount: 0 };
    }
  }

  /**
   * Marca todas as notificações como lidas atualizando timestamp e limpando pendências
   */
  async markAllAsRead(tenantId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { permissions: true }
    });

    const currentPerms = (user?.permissions as any) || {};
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

  /**
   * Marca uma notificação individual como lida
   */
  async markAsRead(tenantId: string, userId: string, notificationId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { permissions: true }
    });

    const currentPerms = (user?.permissions as any) || {};
    const readIds = new Set<string>(
      Array.isArray(currentPerms.readNotificationIds) ? currentPerms.readNotificationIds : []
    );

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
}
