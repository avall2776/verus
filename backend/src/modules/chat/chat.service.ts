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
      whereClause.status = { in: ['resolved', 'closed'] };
      // Garantir que NÃO filtra por assignedTo nesta aba para possibilitar auditoria completa
    } else if (tab === 'mine') {
      whereClause.status = { in: ['open', 'human_takeover'] };
      whereClause.assignedTo = userId;
    } else {
      // tab === 'waiting'
      whereClause.status = { in: ['waiting', 'bot_active'] };
      whereClause.assignedTo = null; // Fila esperando

      if (userRole === 'AGENT') {
        // Se for agent, só vê a fila dos departamentos que pertence
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

  async getConversationByContact(tenantId: string, contactId: string) {
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
      throw new NotFoundException('Nenhuma conversa encontrada para este contato.');
    }

    return conversation;
  }

  async getConversationById(tenantId: string, conversationId: string) {
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
      throw new NotFoundException('Conversa não encontrada.');
    }

    return conversation;
  }

  async takeoverConversation(tenantId: string, conversationId: string, userId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation || conversation.tenantId !== tenantId) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    const updated = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'human_takeover', assignedTo: userId }
    });
    
    this.chatGateway.emitConversationUpdated(tenantId, updated);
    return updated;
  }

  async releaseConversation(tenantId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation || conversation.tenantId !== tenantId) {
      throw new NotFoundException('Conversa não encontrada.');
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

  async reopenConversation(tenantId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation || conversation.tenantId !== tenantId) {
      throw new NotFoundException('Conversa não encontrada.');
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

  async transferToDepartment(tenantId: string, conversationId: string, departmentId: string, userId?: string) {
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

    // Ao transferir para um setor:
    // - Atualiza departmentId
    // - Define assignedTo = null (ou operador específico)
    // - Atualiza status para waiting (fila do novo departamento)
    // - PRESERVAÇÃO DE SLA: Preserva o updatedAt original para não resetar o tempo de espera acumulado
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

  async sendManualMessageToContact(tenantId: string, contactId: string, payload: any, userId: string) {
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
}
