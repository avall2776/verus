import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway'; // Reaproveitando o gateway global

@Injectable()
export class TeamChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway
  ) {}

  async getUsers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: { id: true, name: true, role: true, isOnline: true },
      orderBy: { name: 'asc' }
    });
  }

  async getChannels(tenantId: string) {
    return this.prisma.teamChannel.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' }
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

  async sendMessage(
    tenantId: string, 
    senderId: string, 
    data: { channelId?: string; receiverId?: string; content: string; mediaUrl?: string }
  ) {
    if (!data.content) throw new BadRequestException("Conteúdo vazio.");
    if (!data.channelId && !data.receiverId) throw new BadRequestException("Destino inválido.");

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

    // Emite o evento real-time para a UI
    this.chatGateway.server.to(tenantId).emit('newTeamMessage', message);

    return message;
  }
}
