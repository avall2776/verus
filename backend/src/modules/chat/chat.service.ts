import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { MessagingService } from '../messaging/messaging.service';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messagingService: MessagingService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async findAllConversations(tenantId: string, userId: string, userRole: string, tab: string = 'waiting') {
    const whereClause: any = { tenantId };

    if (tab === 'resolved') {
      whereClause.status = 'resolved';
    } else if (tab === 'mine') {
      whereClause.status = { not: 'resolved' };
      whereClause.assignedTo = userId;
    } else {
      // tab === 'waiting'
      whereClause.status = { not: 'resolved' };
      whereClause.assignedTo = null; // Fila esperando

      if (userRole === 'AGENT') {
        // Se for agent, só ve a fila dos departamentos que pertence
        const userDepts = await this.prisma.userDepartment.findMany({ where: { userId }});
        const deptIds = userDepts.map(d => d.departmentId);
        
        // Pode ver a fila do seu departamento ou fila sem departamento (triagem inicial)
        whereClause.OR = [
          { departmentId: { in: deptIds } },
          { departmentId: null }
        ];
      }
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

  async takeoverConversation(tenantId: string, conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation || conversation.tenantId !== tenantId) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'human_takeover', assignedTo: userId }
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

  async assignToUser(tenantId: string, conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation || conversation.tenantId !== tenantId) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { assignedTo: userId, status: 'open' }
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

    // Execução sequencial p/ evitar lock de banco serverless
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
        senderType: 'user', // Atendente humano
        status: 'delivered',
      }
    });

    // Só envia para o WhatsApp/API externa se NÃO for nota interna
    if (!isInternal) {
      await this.messagingService.sendText({
        tenantId,
        phone: conversation.contact.phone,
        content: payload.content,
      });
    }

    if (conversation.status === 'bot_active' && !isInternal) {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { status: 'human_takeover' }
      });
    }

    // Emite o evento via WebSocket para atualizar todos os clientes (outros atendentes na mesma tela)
    this.chatGateway.emitNewMessage(tenantId, msg);

    return msg; // Retorna a mensagem criada
  }
}
