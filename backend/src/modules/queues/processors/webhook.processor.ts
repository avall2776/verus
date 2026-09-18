import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../../shared/database/prisma.service';
import { ChatGateway } from '../../chat/chat.gateway';
import { MessagingService } from '../../messaging/messaging.service';
import { AutomationsService } from '../../automations/automations.service';
import { WhatsappService } from '../../whatsapp/whatsapp.service';
import { AiService } from '../../ai/ai.service';

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
    private readonly aiService: AiService,
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

    // Helper para recuperar buffer binário salvo localmente em uploads/
    const getLocalBuffer = (url: string | null): Buffer | null => {
      if (!url) return null;
      try {
        const basename = path.basename(url);
        const folder = url.includes('/audio/') ? 'audio' : 'media';
        const candidate1 = path.join(process.cwd(), 'uploads', folder, basename);
        if (fs.existsSync(candidate1)) return fs.readFileSync(candidate1);
        const candidate2 = path.join(process.cwd(), 'uploads', 'audio', basename);
        if (fs.existsSync(candidate2)) return fs.readFileSync(candidate2);
        const candidate3 = path.join(process.cwd(), 'uploads', 'media', basename);
        if (fs.existsSync(candidate3)) return fs.readFileSync(candidate3);
        return null;
      } catch {
        return null;
      }
    };

    // 2. Extração de Conteúdo e Processamento Multimodal (Áudio, Imagem, Documento/PDF)
    const isAudio =
      message.type === 'audio' ||
      message.type === 'voice' ||
      message.type === 'ptt' ||
      !!message.audio ||
      !!message.voice ||
      evolutionMetadata?.mediaType === 'audio';

    const isImage =
      message.type === 'image' ||
      !!message.image ||
      evolutionMetadata?.mediaType === 'image';

    const isDocument =
      message.type === 'document' ||
      !!message.document ||
      evolutionMetadata?.mediaType === 'document';

    let content = message.text?.body || '';
    let msgType = isAudio ? 'audio' : isImage ? 'image' : isDocument ? 'document' : (message.type || 'text');
    let mediaUrl: string | null = null;

    if (isAudio) {
      msgType = 'audio';
      const audioObj = message.audio || message.voice;
      const mediaId = audioObj?.id;
      const directUrl = audioObj?.link || audioObj?.url || evolutionMetadata?.mediaUrl;
      const mimeType = audioObj?.mime_type || evolutionMetadata?.mediaMime || 'audio/ogg';

      if (directUrl) {
        mediaUrl = directUrl;
      } else if (mediaId) {
        mediaUrl = await this.whatsappService.downloadAndSaveMedia(tenantId, mediaId, mimeType);
      }

      // Transcrição Automática via Whisper (Speech-to-Text)
      const audioBuffer = getLocalBuffer(mediaUrl);
      if (audioBuffer) {
        this.logger.log(`[Multimodal Audio] Transcrevendo áudio recebido de ${remoteJid}...`);
        const transcription = await this.aiService.transcribeAudio(
          audioBuffer,
          path.basename(mediaUrl || 'audio.ogg'),
          mimeType
        );
        if (transcription) {
          content = `🎤 [Áudio]: "${transcription}"`;
        } else {
          content = '🎤 Mensagem de voz';
        }
      } else {
        content = '🎤 Mensagem de voz';
      }
    } else if (isImage) {
      msgType = 'image';
      const imgObj = message.image;
      const mediaId = imgObj?.id;
      const directUrl = imgObj?.link || imgObj?.url || evolutionMetadata?.mediaUrl;
      const mimeType = imgObj?.mime_type || evolutionMetadata?.mediaMime || 'image/jpeg';
      const caption = imgObj?.caption || evolutionMetadata?.mediaCaption || message.text?.body || '';

      if (directUrl) {
        mediaUrl = directUrl;
      } else if (mediaId) {
        mediaUrl = await this.whatsappService.downloadAndSaveMedia(tenantId, mediaId, mimeType);
      }

      // Análise Visual via Vision (GPT-4o-mini / Vision)
      const imageBuffer = getLocalBuffer(mediaUrl);
      if (imageBuffer) {
        this.logger.log(`[Multimodal Vision] Analisando imagem recebida de ${remoteJid}...`);
        const visualAnalysis = await this.aiService.analyzeImage(imageBuffer, mimeType, caption);
        if (visualAnalysis) {
          content = caption
            ? `${caption}\n📷 [Análise da Imagem]: ${visualAnalysis}`
            : `📷 [Análise da Imagem]: ${visualAnalysis}`;
        } else {
          content = caption || '📷 Foto';
        }
      } else {
        content = caption || '📷 Foto';
      }
    } else if (isDocument) {
      msgType = 'document';
      const docObj = message.document;
      const mediaId = docObj?.id;
      const directUrl = docObj?.link || docObj?.url || evolutionMetadata?.mediaUrl;
      const mimeType = docObj?.mime_type || evolutionMetadata?.mediaMime || 'application/pdf';
      const caption = docObj?.caption || evolutionMetadata?.mediaCaption || message.text?.body || '';
      const filename = docObj?.filename || evolutionMetadata?.mediaFilename || 'documento.pdf';

      if (directUrl) {
        mediaUrl = directUrl;
      } else if (mediaId) {
        mediaUrl = await this.whatsappService.downloadAndSaveMedia(tenantId, mediaId, mimeType);
      }

      // Extração de Conteúdo de Documento (PDF / Texto)
      const docBuffer = getLocalBuffer(mediaUrl);
      if (docBuffer) {
        this.logger.log(`[Multimodal Doc] Extraindo texto do documento recebido de ${remoteJid}...`);
        const docText = await this.aiService.extractDocumentText(docBuffer, mimeType, filename);
        if (docText) {
          content = caption
            ? `${caption}\n📄 [Documento: ${filename}]:\n${docText}`
            : `📄 [Documento: ${filename}]:\n${docText}`;
        } else {
          content = caption || filename || '📄 Documento';
        }
      } else {
        content = caption || filename || '📄 Documento';
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

