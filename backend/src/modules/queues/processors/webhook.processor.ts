import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { ChatGateway } from '../../chat/chat.gateway';

@Processor('webhook-ingress')
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('ai-processing') private readonly aiQueue: Queue,
    private readonly chatGateway: ChatGateway,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { tenantId, webhookData } = job.data;
    
    // Parse Meta API Payload
    const entry = webhookData.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];
    const contactInfo = value?.contacts?.[0];

    if (!message) return { status: 'ignored' };

    const messageId = message.id;
    const remoteJid = message.from; // Número do cliente
    const fromMe = false; // A Meta Cloud API de entrada via Webhook (neste formato) sempre é do cliente para o bot
    const pushName = contactInfo?.profile?.name || remoteJid;

    this.logger.debug(`Processando job [${job.id}] - Mensagem de ${remoteJid} (Tenant: ${tenantId})`);

    // 1. Idempotência: Verifica se a mensagem já existe
    const existingMessage = await this.prisma.message.findUnique({
      where: {
        tenantId_providerMessageId: {
          tenantId,
          providerMessageId: messageId,
        }
      }
    });

    if (existingMessage) {
      this.logger.warn(`Mensagem [${messageId}] já processada. Ignorando.`);
      return { status: 'ignored_duplicate' };
    }

    // 2. Extração de Conteúdo Básica (Para simplificar, vamos pegar só texto)
    let content = message.text?.body || '[Mídia Não Suportada na Simulação]';
    let mediaType = message.type;
    
    // 3. Upsert do Contact
    const phone = remoteJid;
    const contact = await this.prisma.contact.upsert({
      where: {
        tenantId_phone: {
          tenantId,
          phone,
        }
      },
      create: {
        tenantId,
        phone,
        name: pushName,
        source: 'WhatsApp',
      },
      update: {
        name: pushName
      }
    });

    // 4. Upsert da Conversation (Sempre pega a conversa ativa, ou cria uma)
    let conversation = await this.prisma.conversation.findFirst({
      where: {
        tenantId,
        contactId: contact.id,
        status: { not: 'resolved' } // bot_active ou human_takeover
      }
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          tenantId,
          contactId: contact.id,
          status: 'bot_active',
        }
      });
    }

    // 5. Persistir a Mensagem (Inbound)
    const savedMessage = await this.prisma.message.create({
      data: {
        tenantId,
        conversationId: conversation.id,
        contactId: contact.id,
        providerMessageId: messageId,
        direction: 'INBOUND',
        content,
        senderType: 'contact',
        status: 'delivered', 
      }
    });

    this.logger.log(`Mensagem [${messageId}] salva com sucesso na conversa [${conversation.id}]`);

    // -> EMISSÃO EM TEMPO REAL PARA O FRONT-END <-
    this.chatGateway.emitNewMessage(tenantId, {
      ...savedMessage,
      contact: { phone: contact.phone, name: contact.name }
    });

    // 6. Integração com Fase 4: Despachar para fila de IA APENAS se o bot estiver ativo! (Handoff)
    if (conversation.status === 'bot_active') {
      await this.aiQueue.add(
        'generate-reply',
        {
          tenantId,
          conversationId: conversation.id,
          contactId: contact.id,
        },
        { attempts: 2, backoff: { type: 'fixed', delay: 2000 } }
      );
      this.logger.log(`Conversa [${conversation.id}] encaminhada para processamento de IA.`);
    } else {
      this.logger.log(`Conversa [${conversation.id}] ignorada pela IA. O status atual é Humano (${conversation.status}).`);
    }

    return { status: 'success', messageId: savedMessage.id };
  }
}

