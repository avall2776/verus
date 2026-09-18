import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { ChatGateway } from '../../chat/chat.gateway';
import { MessagingService } from '../../messaging/messaging.service';
import { AutomationsService } from '../../automations/automations.service';
import { WhatsappService } from '../../whatsapp/whatsapp.service';

@Processor('webhook-ingress')
export class WebhookProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('ai-processing') private readonly aiQueue: Queue,
    private readonly chatGateway: ChatGateway,
    private readonly messagingService: MessagingService,
    private readonly automationsService: AutomationsService,
    private readonly whatsappService: WhatsappService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { tenantId, webhookData, evolutionMetadata } = job.data;
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

    // 2. Extração de Conteúdo e Mídias (Áudio, Voz/PTT, Imagem, Documento)
    const isAudio = message.type === 'audio' || message.type === 'voice' || message.type === 'ptt' || !!message.audio || !!message.voice;
    let content = message.text?.body || '';
    let msgType = message.type || 'text';
    let mediaUrl: string | null = null;

    if (isAudio) {
      msgType = 'audio';
      content = '🎤 Mensagem de voz';
      const audioObj = message.audio || message.voice;
      const mediaId = audioObj?.id;
      const directUrl = audioObj?.link || audioObj?.url;
      const mimeType = audioObj?.mime_type || 'audio/ogg';

      if (mediaId) {
        mediaUrl = await this.whatsappService.downloadAndSaveMedia(tenantId, mediaId, mimeType);
      } else if (directUrl) {
        mediaUrl = directUrl;
      }
    } else if (message.image) {
      msgType = 'image';
      content = message.image.caption || '📷 Foto';
      if (message.image.id) {
        mediaUrl = await this.whatsappService.downloadAndSaveMedia(tenantId, message.image.id, message.image.mime_type || 'image/jpeg');
      }
    } else if (message.document) {
      msgType = 'document';
      content = message.document.filename || message.document.caption || '📄 Documento';
      if (message.document.id) {
        mediaUrl = await this.whatsappService.downloadAndSaveMedia(tenantId, message.document.id, message.document.mime_type || 'application/pdf');
      }
    } else if (!content) {
      content = '[Mídia Recebida]';
    }
    
    // 3. Upsert do Contact
    const phone = remoteJid;
    const rawPushName = pushName || evolutionMetadata?.pushName;
    const isGenericPushName = !rawPushName || rawPushName === 'Cliente WhatsApp' || rawPushName.includes('@lid') || rawPushName.startsWith('WhatsApp');
    const cleanName = !isGenericPushName
      ? rawPushName
      : (remoteJid.includes('@lid') ? 'Cliente WhatsApp' : `WhatsApp (${remoteJid})`);

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
        name: cleanName,
        source: 'WhatsApp',
        avatarUrl: (evolutionMetadata?.profilePictureUrl && !evolutionMetadata.profilePictureUrl.includes('unsplash.com')) ? evolutionMetadata.profilePictureUrl : null,
      },
      update: !isGenericPushName ? { name: rawPushName } : {}
    });

    // Se o contato ainda tiver nome genérico ou não tiver foto, sincroniza metadados completos
    const isGenericContact = !contact.name || contact.name === 'Cliente WhatsApp' || contact.name.includes('@lid') || contact.name.startsWith('WhatsApp');
    if (!contact.avatarUrl || isGenericContact) {
      try {
        const synced = await this.whatsappService.syncContactMetadata(tenantId, contact.id);
        if (synced?.avatarUrl) contact.avatarUrl = synced.avatarUrl;
        if (synced?.name) contact.name = synced.name;
      } catch (err: any) {
        this.logger.warn(`Erro na sincronização de perfil do contato ${contact.id}: ${err.message}`);
      }
    }

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
        assignedTo: null,
      },
      update: {} // Apenas recupera se já existir
    });

    if (conversation.status === 'resolved' || conversation.status === 'closed') {
      // Reabre a mesma conversa com IA Ativa na Fila Aguardando (assignedTo = null)
      conversation = await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { status: 'bot_active', assignedTo: null }
      });
      this.logger.log(`Conversa [${conversation.id}] reaberta (status -> bot_active, assignedTo -> null).`);
      
      // Emite atualização para as telas (mover de Resolvidos -> Aguardando)
      this.chatGateway.emitConversationUpdated(tenantId, conversation);
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
        type: msgType,
        mediaUrl,
        senderType: 'contact',
        status: 'delivered', 
      }
    });

    this.logger.log(`Mensagem [${messageId}] salva com sucesso na conversa [${conversation.id}]`);

    // Gatilhos de automação
    if (conversation.status === 'waiting' || conversation.status === 'bot_active') {
       // Possível nova conversa ou inatividade 
       await this.automationsService.evaluateEvent(tenantId, 'NEW_CONVERSATION', { 
         contactId: contact.id, 
         conversationId: conversation.id 
       });
    }

    await this.automationsService.evaluateEvent(tenantId, 'INACTIVITY', { 
         contactId: contact.id, 
         conversationId: conversation.id 
    });

    // -> EMISSÃO EM TEMPO REAL PARA O FRONT-END <-
    this.chatGateway.emitNewMessage(tenantId, {
      ...savedMessage,
      contact: { phone: contact.phone, name: contact.name, avatarUrl: contact.avatarUrl }
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
          contact: { phone: contact.phone, name: contact.name, avatarUrl: contact.avatarUrl }
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

