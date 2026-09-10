import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { ChatGateway } from '../../chat/chat.gateway';

import { MessagingService } from '../../messaging/messaging.service';

@Processor('webhook-ingress')
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('ai-processing') private readonly aiQueue: Queue,
    private readonly chatGateway: ChatGateway,
    private readonly messagingService: MessagingService,
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

    // Validar Horário de Expediente
    const currentDay = new Date().getDay(); // 0 = Domingo
    const currentHourStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit', timeZone: 'America/Sao_Paulo' });
    
    const bh = await this.prisma.businessHours.findFirst({
      where: { tenantId, dayOfWeek: currentDay, isActive: true }
    });

    let isWithinBusinessHours = true;
    if (bh) {
      if (currentHourStr < bh.startTime || currentHourStr > bh.endTime) {
        isWithinBusinessHours = false;
      }
    }

    if (!isWithinBusinessHours) {
      this.logger.log(`Fora do horário comercial. Enviando fallback para ${phone}.`);
      
      const fallbackMsg = "Olá! Nosso horário de atendimento é de segunda a sexta, das 08h às 18h. Já recebemos sua mensagem e retornaremos assim que nossa equipe iniciar o expediente!";
      
      await this.messagingService.sendText({
        tenantId,
        phone,
        content: fallbackMsg
      });

      // Salva a mensagem no banco? Sim, mas precisamos da conversa primeiro.
    }

    // 4. Buscar a conversa (só pode haver UMA por contato agora)
    let conversation = await this.prisma.conversation.upsert({
      where: {
        tenantId_contactId: {
          tenantId,
          contactId: contact.id
        }
      },
      create: {
        tenantId,
        contactId: contact.id,
        status: 'bot_active',
      },
      update: {} // Apenas recupera se já existir
    });

    if (conversation.status === 'resolved') {
      // Reabre a mesma conversa se o cliente voltar a mandar mensagem
      conversation = await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: 'bot_active' }
      });
      this.logger.log(`Conversa [${conversation.id}] reaberta (status -> bot_active).`);
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

    // 6. Integração com Fase 4: Despachar para fila de IA APENAS se o bot estiver ativo e DENTRO do horário comercial!
    if (conversation.status === 'bot_active') {
      if (!isWithinBusinessHours) {
        this.logger.log(`Conversa [${conversation.id}] mantida sem IA por estar fora do expediente.`);
        
        // Salva a mensagem de fallback como se o bot tivesse respondido
        const fallbackMsgText = "Olá! Nosso horário de atendimento é de segunda a sexta, das 08h às 18h. Já recebemos sua mensagem e retornaremos assim que nossa equipe iniciar o expediente!";
        const fallbackMessage = await this.prisma.message.create({
          data: {
            tenantId,
            conversationId: conversation.id,
            contactId: contact.id,
            providerMessageId: `fallback_${Date.now()}`,
            direction: 'OUTBOUND',
            content: fallbackMsgText,
            senderType: 'system',
            status: 'delivered', 
          }
        });
        
        this.chatGateway.emitNewMessage(tenantId, {
          ...fallbackMessage,
          contact: { phone: contact.phone, name: contact.name }
        });

        return { status: 'out_of_business_hours' };
      }

      const jobId = `ai_reply_${conversation.id}`;
      
      // Debounce: Remove job anterior se ainda não começou a processar
      const existingJob = await this.aiQueue.getJob(jobId);
      if (existingJob) {
        const state = await existingJob.getState();
        if (state === 'delayed' || state === 'waiting') {
          await existingJob.remove();
          this.logger.debug(`Debounce: Job anterior cancelado para conversa [${conversation.id}]`);
        }
      }

      // Adiciona o novo job com delay de 10 segundos
      await this.aiQueue.add(
        'generate-reply',
        {
          tenantId,
          conversationId: conversation.id,
          contactId: contact.id,
        },
        { 
          jobId, 
          delay: 10000, // 10 segundos de buffer
          attempts: 2, 
          backoff: { type: 'fixed', delay: 2000 } 
        }
      );
      this.logger.log(`Conversa [${conversation.id}] agendada para IA em 10 segundos (Buffer).`);
    } else {
      this.logger.log(`Conversa [${conversation.id}] ignorada pela IA. O status atual é Humano (${conversation.status}).`);
    }

    return { status: 'success', messageId: savedMessage.id };
  }
}

