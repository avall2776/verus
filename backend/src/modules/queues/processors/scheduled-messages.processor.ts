import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../../shared/database/prisma.service';
import { MessagingService } from '../../messaging/messaging.service';
import { ChatGateway } from '../../chat/chat.gateway';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
@Processor('scheduled-messages')
export class ScheduledMessagesProcessor extends WorkerHost {
  private readonly logger = new Logger(ScheduledMessagesProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly messagingService: MessagingService,
    private readonly chatGateway: ChatGateway,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { messageId, tenantId, conversationId } = job.data;
    this.logger.log(`Processando mensagem agendada: ${messageId} para conversa ${conversationId}`);

    try {
      const message = await this.prisma.message.findUnique({
        where: { id: messageId },
        include: {
          contact: true,
          conversation: true,
        },
      });

      if (!message) {
        this.logger.warn(`Mensagem agendada ${messageId} não encontrada. Abortando.`);
        return { status: 'not_found' };
      }

      // Se a mensagem foi cancelada ou já processada
      if (message.status !== 'scheduled') {
        this.logger.log(`Mensagem ${messageId} não está mais agendada (status atual: "${message.status}"). Ignorando.`);
        return { status: 'skipped', currentStatus: message.status };
      }

      // Dispara envio para a Meta Cloud API via MessagingService
      if (!message.isInternal && message.contact?.phone) {
        if ((message.type === 'image' || message.type === 'document') && message.mediaUrl) {
          await this.messagingService.sendMedia({
            tenantId: message.tenantId,
            phone: message.contact.phone,
            type: message.type,
            mediaUrl: message.mediaUrl,
            content: message.content,
            filename: message.content?.includes('.') ? message.content : (message.type === 'document' ? 'documento.pdf' : 'imagem.jpg'),
          });
        } else {
          await this.messagingService.sendText({
            tenantId: message.tenantId,
            phone: message.contact.phone,
            content: message.content,
          });
        }
      }

      // Atualiza o status da mensagem para 'delivered'
      const updatedMessage = await this.prisma.message.update({
        where: { id: messageId },
        data: {
          status: 'delivered',
        },
      });

      // Se a conversa estava sob controle da IA, assume para atendimento humano
      if (message.conversation?.status === 'bot_active' && !message.isInternal) {
        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { status: 'human_takeover' },
        });
      }

      // Notifica o frontend em tempo real via WebSocket
      this.chatGateway.emitNewMessage(tenantId, updatedMessage);
      this.chatGateway.emitConversationUpdated(tenantId, {
        id: conversationId,
        updatedAt: new Date(),
      });

      this.logger.log(`Mensagem agendada ${messageId} disparada e entregue com sucesso!`);
      return { status: 'success', messageId };
    } catch (error: any) {
      this.logger.error(`Erro ao disparar mensagem agendada ${messageId}: ${error?.message}`, error?.stack);

      // Marca a mensagem como falha
      await this.prisma.message.update({
        where: { id: messageId },
        data: { status: 'failed' },
      }).catch(() => null);

      throw error;
    }
  }
}
