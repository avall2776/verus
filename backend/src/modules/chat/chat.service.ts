import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PrismaService } from '../../shared/database/prisma.service';

const execAsync = promisify(exec);
import { MessagingService } from '../messaging/messaging.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { ChatGateway } from './chat.gateway';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messagingService: MessagingService,
    private readonly whatsappService: WhatsappService,
    private readonly chatGateway: ChatGateway,
    @InjectQueue('scheduled-messages') private readonly scheduledQueue: Queue,
  ) {}

  async getConversationCounts(tenantId: string, userId: string, userRole: string) {
    const isMaster = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    const [waiting, mine, resolved] = await Promise.all([
      this.prisma.conversation.count({
        where: {
          tenantId,
          status: { in: ['waiting', 'bot_active'] },
          assignedTo: null,
        }
      }),
      this.prisma.conversation.count({
        where: {
          tenantId,
          status: { in: ['open', 'human_takeover', 'in_progress'] },
          ...(isMaster ? {} : { assignedTo: userId }),
        }
      }),
      this.prisma.conversation.count({
        where: {
          tenantId,
          status: { in: ['resolved', 'closed'] },
        }
      }),
    ]);

    return { waiting, mine, resolved, total: waiting + mine + resolved };
  }

  async findAllConversations(tenantId: string, userId: string, userRole: string, tab: string = 'waiting') {
    const whereClause: any = { tenantId };
    const isMaster = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    if (tab === 'all' || tab === 'unread') {
      // Traz todas as conversas do tenant sem restringir status
      if (!isMaster && userRole === 'AGENT') {
        const userDepts = await this.prisma.userDepartment.findMany({ where: { userId }});
        const deptIds = userDepts.map(d => d.departmentId);
        whereClause.OR = [
          { assignedTo: userId },
          { departmentId: { in: deptIds } },
          { departmentId: null }
        ];
      }
    } else if (tab === 'resolved') {
      whereClause.status = { in: ['resolved', 'closed'] };
    } else if (tab === 'mine') {
      whereClause.status = { in: ['open', 'human_takeover', 'in_progress'] };
      if (!isMaster) {
        whereClause.assignedTo = userId;
      }
    } else {
      // tab === 'waiting'
      whereClause.status = { in: ['waiting', 'bot_active'] };
      whereClause.assignedTo = null;

      if (userRole === 'AGENT') {
        const userDepts = await this.prisma.userDepartment.findMany({ where: { userId }});
        const deptIds = userDepts.map(d => d.departmentId);
        whereClause.OR = [
          { departmentId: { in: deptIds } },
          { departmentId: null }
        ];
      }
    }

    const conversations = await this.prisma.conversation.findMany({
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

    // Sanitiza e formata avatarUrl de forma ultra rápida em memória sem travar requisições
    for (const conv of conversations) {
      if (conv.contact) {
        const av = conv.contact.avatarUrl;
        if (!av || av === 'null' || av === 'undefined' || av.includes('unsplash.com')) {
          conv.contact.avatarUrl = null;
        }
      }
    }

    return conversations;
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

    if (conversation.contact) {
      const av = conversation.contact.avatarUrl;
      if (!av || av === 'null' || av === 'undefined' || av.includes('unsplash.com')) {
        conversation.contact.avatarUrl = null;
      }
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

    if (conversation.contact) {
      const av = conversation.contact.avatarUrl;
      if (!av || av === 'null' || av === 'undefined' || av.includes('unsplash.com')) {
        conversation.contact.avatarUrl = null;
      }
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

  async markAsRead(tenantId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation || conversation.tenantId !== tenantId) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    await this.prisma.message.updateMany({
      where: {
        tenantId,
        conversationId,
        direction: 'INBOUND',
        status: { not: 'read' }
      },
      data: { status: 'read' }
    });

    this.chatGateway.emitConversationUpdated(tenantId, { ...conversation, unreadCount: 0 });
    return { success: true, conversationId, unreadCount: 0 };
  }

  async markAsUnread(tenantId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (!conversation || conversation.tenantId !== tenantId) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    this.chatGateway.emitConversationUpdated(tenantId, { ...conversation, unreadCount: 1 });
    return { success: true, conversationId, unreadCount: 1 };
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



  /**
   * Normaliza e valida data e horário de agendamento com suporte estrito a fuso horário.
   * Se a data informada não contiver offset (ex: YYYY-MM-DDTHH:mm:ss), aplica por padrão
   * o fuso horário de Brasília (-03:00) para evitar desvios inadvertidos de UTC.
   */
  private parseScheduledDate(scheduledAt: string, timezone?: string): Date {
    if (!scheduledAt) {
      throw new BadRequestException('A data e o horário de agendamento são obrigatórios.');
    }

    const dateStr = scheduledAt.trim();
    const hasTimezone = /Z|[+-]\d{2}(:?\d{2})?$/.test(dateStr);

    let parsedDate: Date;
    if (hasTimezone) {
      parsedDate = new Date(dateStr);
    } else {
      const offset = timezone === 'UTC' ? 'Z' : '-03:00';
      parsedDate = new Date(`${dateStr}${offset}`);
    }

    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Formato de data ou horário inválido para agendamento.');
    }

    // Regra de negócio estrita: o agendamento deve ser definido para um momento futuro (mínimo 10 segundos)
    const now = Date.now();
    if (parsedDate.getTime() <= now + 10000) {
      throw new BadRequestException('O horário de agendamento deve ser definido para um momento futuro.');
    }

    return parsedDate;
  }

  /**
   * Agenda uma mensagem para disparo futuro na conversa, persistindo no Supabase via Prisma
   * e programando o delay com precisão no BullMQ.
   */
  async scheduleMessage(
    tenantId: string,
    conversationId: string,
    payload: {
      content: string;
      scheduledAt: string;
      timezone?: string;
      isInternal?: boolean;
      type?: string;
      mediaUrl?: string;
    }
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true }
    });

    if (!conversation || conversation.tenantId !== tenantId) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    if (!payload.content || !payload.content.trim()) {
      throw new BadRequestException('O conteúdo da mensagem é obrigatório.');
    }

    // Validação de fuso horário e regras de negócio
    const scheduledDate = this.parseScheduledDate(payload.scheduledAt, payload.timezone);
    const delayMs = Math.max(0, scheduledDate.getTime() - Date.now());

    const isInternal = payload.isInternal || false;
    const type = payload.type || 'text';
    const mediaUrl = payload.mediaUrl || null;

    // Registra no banco de dados com status 'scheduled'
    const msg = await this.prisma.message.create({
      data: {
        tenantId,
        conversationId,
        providerMessageId: `scheduled_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        contactId: conversation.contactId,
        content: payload.content.trim(),
        type,
        mediaUrl,
        isInternal,
        direction: 'OUTBOUND',
        senderType: 'user',
        status: 'scheduled',
        scheduledAt: scheduledDate,
      }
    });

    // Enfileira o job no BullMQ com delay milissegundo correspondente
    await this.scheduledQueue.add(
      'sendScheduledMessage',
      {
        messageId: msg.id,
        tenantId,
        conversationId,
      },
      {
        delay: delayMs,
        jobId: `msg_scheduled_${msg.id}`,
        removeOnComplete: true,
      }
    );

    // Emite evento via WebSocket para notificar os atendentes conectados
    this.chatGateway.emitNewMessage(tenantId, msg);

    return msg;
  }

  /**
   * Retorna todas as mensagens atualmente agendadas e pendentes de envio de uma conversa
   */
  async getScheduledMessages(tenantId: string, conversationId: string) {
    return this.prisma.message.findMany({
      where: {
        tenantId,
        conversationId,
        status: 'scheduled',
      },
      orderBy: { scheduledAt: 'asc' }
    });
  }

  /**
   * Retorna todas as mensagens agendadas e pendentes de todo o Tenant (Central Global)
   */
  async getAllScheduledMessages(tenantId: string) {
    return this.prisma.message.findMany({
      where: {
        tenantId,
        status: 'scheduled',
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
          }
        },
        conversation: {
          select: {
            id: true,
            status: true,
          }
        }
      },
      orderBy: { scheduledAt: 'asc' }
    });
  }

  /**
   * Cancela em lote múltiplas mensagens agendadas
   */
  async batchCancelScheduledMessages(tenantId: string, messageIds: string[]) {
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      throw new BadRequestException('Nenhum identificador de mensagem informado.');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        id: { in: messageIds },
        tenantId,
        status: 'scheduled',
      }
    });

    const validIds = messages.map(m => m.id);

    // Remove do BullMQ
    await Promise.all(
      validIds.map(async (id) => {
        try {
          const job = await this.scheduledQueue.getJob(`msg_scheduled_${id}`);
          if (job) await job.remove();
        } catch {}
      })
    );

    // Remove do banco de dados
    const result = await this.prisma.message.deleteMany({
      where: {
        id: { in: validIds },
        tenantId,
      }
    });

    return {
      success: true,
      canceledCount: result.count,
      canceledIds: validIds,
    };
  }

  /**
   * Cancela uma mensagem agendada antes do disparo, removendo-a da fila BullMQ
   */
  async cancelScheduledMessage(tenantId: string, messageId: string) {
    const msg = await this.prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!msg || msg.tenantId !== tenantId) {
      throw new NotFoundException('Mensagem agendada não encontrada.');
    }

    if (msg.status !== 'scheduled') {
      throw new BadRequestException('Esta mensagem não possui agendamento pendente.');
    }

    try {
      const job = await this.scheduledQueue.getJob(`msg_scheduled_${msg.id}`);
      if (job) await job.remove();
    } catch {
      // Ignora se o job já foi limpo do Redis
    }

    await this.prisma.message.delete({
      where: { id: messageId }
    });

    return { success: true, messageId };
  }

  async sendManualMessage(
    tenantId: string,
    conversationId: string,
    payload: {
      content: string;
      isInternal?: boolean;
      type?: string;
      mediaUrl?: string;
      scheduledAt?: string;
      timezone?: string;
    }
  ) {
    // Se o payload contiver data/hora de agendamento, encaminha para o fluxo de schedule
    if (payload.scheduledAt) {
      return this.scheduleMessage(tenantId, conversationId, {
        content: payload.content,
        scheduledAt: payload.scheduledAt,
        timezone: payload.timezone,
        isInternal: payload.isInternal,
        type: payload.type,
        mediaUrl: payload.mediaUrl,
      });
    }

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
    if (!isInternal && conversation.contact?.phone) {
      if ((type === 'image' || type === 'document') && mediaUrl) {
        await this.messagingService.sendMedia({
          tenantId,
          phone: conversation.contact.phone,
          type,
          mediaUrl,
          content: payload.content,
          filename: payload.content?.includes('.') ? payload.content : (type === 'document' ? 'documento.pdf' : 'imagem.jpg'),
        });
      } else {
        await this.messagingService.sendText({
          tenantId,
          phone: conversation.contact.phone,
          content: payload.content,
        });
      }
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

  async sendManualAudioMessage(
    tenantId: string,
    conversationId: string,
    file: Express.Multer.File,
    payload: { content?: string; isInternal?: boolean }
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { contact: true }
    });

    if (!conversation || conversation.tenantId !== tenantId) {
      throw new NotFoundException('Conversa não encontrada.');
    }

    const isInternal = payload.isInternal || false;
    
    // Transcodifica para Ogg Opus (mono 24kHz) padrão WhatsApp PTT nativo se ffmpeg disponível
    let finalBuffer: Buffer = file.buffer;
    let finalMimeType = 'audio/ogg';
    let ext = 'ogg';

    const tempInput = path.join(os.tmpdir(), `input_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.webm`);
    const tempOutput = path.join(os.tmpdir(), `output_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.ogg`);

    try {
      await fs.promises.writeFile(tempInput, file.buffer);
      await execAsync(`ffmpeg -y -i "${tempInput}" -c:a libopus -b:a 32k -ac 1 -ar 24000 -vn "${tempOutput}"`);
      finalBuffer = await fs.promises.readFile(tempOutput);
      finalMimeType = 'audio/ogg';
      ext = 'ogg';
    } catch (ffmpegErr: any) {
      finalBuffer = file.buffer;
      finalMimeType = file.mimetype || 'audio/webm';
      ext = file.mimetype?.includes('ogg') ? 'ogg' : 'webm';
    } finally {
      try { if (fs.existsSync(tempInput)) await fs.promises.unlink(tempInput); } catch (e) {}
      try { if (fs.existsSync(tempOutput)) await fs.promises.unlink(tempOutput); } catch (e) {}
    }

    const filename = `audio_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'uploads', 'audio');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    await fs.promises.writeFile(filePath, finalBuffer);

    const mediaUrl = `/api-backend/media/audio/${filename}`;

    const msg = await this.prisma.message.create({
      data: {
        tenantId,
        conversationId,
        providerMessageId: `audio_${Date.now()}`,
        contactId: conversation.contactId,
        content: payload.content || '🎤 Mensagem de voz',
        type: 'audio',
        mediaUrl,
        isInternal,
        direction: 'OUTBOUND',
        senderType: 'user',
        status: 'delivered',
      }
    });

    if (!isInternal && conversation.contact?.phone) {
      await this.messagingService.sendAudio({
        tenantId,
        phone: conversation.contact.phone,
        audioBuffer: finalBuffer,
        audioUrl: mediaUrl,
        mimeType: finalMimeType,
      });
    }

    if (conversation.status === 'bot_active' && !isInternal) {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { status: 'human_takeover' }
      });
    }

    this.chatGateway.emitNewMessage(tenantId, msg);
    return msg;
  }
}

