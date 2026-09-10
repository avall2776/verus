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
        department: true,
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

  async transferToDepartment(tenantId: string, conversationId: string, departmentId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation || conversation.tenantId !== tenantId) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    const dept = await this.prisma.department.findUnique({
      where: { id: departmentId }
    });
    if (!dept || dept.tenantId !== tenantId) throw new NotFoundException('Departamento inválido.');

    // ROLETA ROUND-ROBIN
    // Buscar todos os atendentes online do departamento
    const onlineAgents = await this.prisma.userDepartment.findMany({
      where: { departmentId, user: { isOnline: true } },
      include: { user: true }
    });

    if (onlineAgents.length === 0) {
      // Nenhum online: fica na fila geral aguardando
      return this.prisma.conversation.update({
        where: { id: conversationId },
        data: { departmentId, status: 'waiting', assignedTo: null } 
      });
    }

    // Descobrir qual agente online tem MENOS conversas ativas no momento (Balanceamento de Carga / Round Robin Dinâmico)
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

  async assignToUser(tenantId: string, conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation || conversation.tenantId !== tenantId) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user || user.tenantId !== tenantId) throw new NotFoundException('Usuário inválido.');

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { assignedTo: userId, status: 'human_takeover' }
    });
  }

  async sendManualMessage(tenantId: string, conversationId: string, payload: { content: string, isInternal?: boolean, type?: string, mediaUrl?: string }) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true }
    });

    if (!conversation || conversation.tenantId !== tenantId) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    const isInternal = payload.isInternal || false;
    const type = payload.type || 'text';
    const mediaUrl = payload.mediaUrl || null;

    // Paralelizando envio da API externa com as chamadas de banco
    const operations: Promise<any>[] = [
      this.prisma.message.create({
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
          senderType: 'user', // Atendente humano
          status: 'delivered',
        }
      })
    ];

    // Só envia para o WhatsApp/API externa se NÃO for nota interna
    if (!isInternal) {
      operations.push(
        this.messagingService.sendText({
          tenantId,
          phone: conversation.contact.phone,
          content: payload.content,
        })
      );
    }

    if (conversation.status === 'bot_active' && !isInternal) {
      operations.push(
        this.prisma.conversation.update({
          where: { id: conversationId },
          data: { status: 'human_takeover' }
        })
      );
    }

    const results = await Promise.all(operations);
    return results[0]; // Retorna a mensagem criada
  }
}
