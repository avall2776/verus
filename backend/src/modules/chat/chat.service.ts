import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { MessagingService } from '../messaging/messaging.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messagingService: MessagingService,
  ) {}

  async findAllConversations(tenantId: string, status?: string) {
    const whereClause: any = { tenantId };
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

  async getConversationMessages(tenantId: string, conversationId: string) {
    // Valida permissão do tenant explicitamente
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation || conversation.tenantId !== tenantId) {
      throw new NotFoundException('Conversa não encontrada ou não pertence a este tenant.');
    }

    return this.prisma.message.findMany({
      where: { tenantId, conversationId },
      orderBy: { createdAt: 'asc' }
    });
  }

  async takeoverConversation(tenantId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation || conversation.tenantId !== tenantId) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'human_takeover' }
    });
  }

  async releaseConversation(tenantId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation || conversation.tenantId !== tenantId) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'resolved' }
    });
  }

  async sendManualMessage(tenantId: string, conversationId: string, content: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true }
    });

    if (!conversation || conversation.tenantId !== tenantId) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    // Paralelizando envio da API externa com as chamadas de banco
    const operations: Promise<any>[] = [
      this.messagingService.sendText({
        tenantId,
        phone: conversation.contact.phone,
        content,
      }),
      this.prisma.message.create({
        data: {
          tenantId,
          conversationId,
          providerMessageId: `manual_${Date.now()}`,
          contactId: conversation.contactId,
          content,
          direction: 'OUTBOUND',
          senderType: 'user', // Atendente humano
          status: 'delivered',
        }
      })
    ];

    if (conversation.status === 'bot_active') {
      operations.push(
        this.prisma.conversation.update({
          where: { id: conversationId },
          data: { status: 'human_takeover' }
        })
      );
    }

    const results = await Promise.all(operations);
    return results[1]; // Retorna a mensagem criada
  }
}
