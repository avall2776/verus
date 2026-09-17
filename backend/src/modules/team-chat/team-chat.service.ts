import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class TeamChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway
  ) {}

  async getUsers(tenantId: string, currentUserId?: string) {
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
    const lastMessages = await Promise.all(
      userIds.map(async (uid) => {
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
      })
    );

    return users.map((user, idx) => ({
      ...user,
      department: user.departments?.[0]?.department?.name || null,
      departmentColor: user.departments?.[0]?.department?.color || null,
      lastMessage: lastMessages[idx] || null
    }));
  }

  async getChannels(tenantId: string) {
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

  async getDepartments(tenantId: string) {
    return this.prisma.department.findMany({
      where: { tenantId },
      select: { id: true, name: true, color: true },
      orderBy: { name: 'asc' }
    });
  }

  async createChannel(tenantId: string, data: { name: string; description?: string; isPrivate?: boolean }) {
    if (!data.name) throw new BadRequestException("Nome do canal é obrigatório.");
    
    return this.prisma.teamChannel.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        isPrivate: data.isPrivate || false
      }
    });
  }

  async getMessages(tenantId: string, currentUserId: string, channelId?: string, receiverId?: string) {
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

  async sendMessage(
    tenantId: string, 
    senderId: string, 
    data: { channelId?: string; receiverId?: string; content: string; mediaUrl?: string }
  ) {
    if (!data.content || !data.content.trim()) throw new BadRequestException("Conteúdo vazio.");
    if (!data.channelId && !data.receiverId) throw new BadRequestException("Destino inválido.");

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

    // Emite o evento real-time para a sala do Tenant
    this.chatGateway.emitNewTeamMessage(tenantId, message);

    return message;
  }

  async deleteMessage(tenantId: string, userId: string, userRole: string, messageId: string) {
    const message = await this.prisma.teamMessage.findFirst({
      where: { id: messageId, tenantId }
    });

    if (!message) {
      throw new NotFoundException('Mensagem não encontrada.');
    }

    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    if (message.senderId !== userId && !isAdmin) {
      throw new ForbiddenException('Você não tem permissão para excluir esta mensagem.');
    }

    await this.prisma.teamMessage.delete({
      where: { id: messageId }
    });

    // Emite evento real-time para os participantes da conversa
    this.chatGateway.emitTeamMessageDeleted(tenantId, {
      messageId,
      channelId: message.channelId,
      senderId: message.senderId,
      receiverId: message.receiverId
    });

    return { success: true, messageId };
  }

  async clearHistory(
    tenantId: string,
    userId: string,
    userRole: string,
    params: { channelId?: string; receiverId?: string }
  ) {
    if (!params.channelId && !params.receiverId) {
      throw new BadRequestException('Informe channelId ou receiverId para limpar o histórico.');
    }

    if (params.channelId) {
      const channel = await this.prisma.teamChannel.findFirst({
        where: { id: params.channelId, tenantId }
      });
      if (!channel) throw new NotFoundException('Canal não encontrado.');

      await this.prisma.teamMessage.deleteMany({
        where: { tenantId, channelId: params.channelId }
      });

      this.chatGateway.emitTeamHistoryCleared(tenantId, {
        channelId: params.channelId
      });

      return { success: true, channelId: params.channelId };
    }

    if (params.receiverId) {
      await this.prisma.teamMessage.deleteMany({
        where: {
          tenantId,
          channelId: null,
          OR: [
            { senderId: userId, receiverId: params.receiverId },
            { senderId: params.receiverId, receiverId: userId }
          ]
        }
      });

      this.chatGateway.emitTeamHistoryCleared(tenantId, {
        user1Id: userId,
        user2Id: params.receiverId
      });

      return { success: true, receiverId: params.receiverId };
    }
  }

  async deleteChannel(tenantId: string, userId: string, userRole: string, channelId: string) {
    const channel = await this.prisma.teamChannel.findFirst({
      where: { id: channelId, tenantId }
    });
    if (!channel) throw new NotFoundException('Canal não encontrado.');

    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
    if (!isAdmin) {
      throw new ForbiddenException('Apenas administradores podem excluir canais da equipe.');
    }

    await this.prisma.teamChannel.delete({
      where: { id: channelId }
    });

    this.chatGateway.emitTeamChannelDeleted(tenantId, channelId);

    return { success: true, channelId };
  }
}
