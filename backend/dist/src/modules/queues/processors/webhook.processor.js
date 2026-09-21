"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WebhookProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const common_1 = require("@nestjs/common");
const fs = require("fs");
const path = require("path");
const prisma_service_1 = require("../../../shared/database/prisma.service");
const chat_gateway_1 = require("../../chat/chat.gateway");
const messaging_service_1 = require("../../messaging/messaging.service");
const automations_service_1 = require("../../automations/automations.service");
const whatsapp_service_1 = require("../../whatsapp/whatsapp.service");
const ai_service_1 = require("../../ai/ai.service");
let WebhookProcessor = WebhookProcessor_1 = class WebhookProcessor extends bullmq_1.WorkerHost {
    constructor(prisma, aiQueue, chatGateway, messagingService, automationsService, whatsappService, aiService) {
        super();
        this.prisma = prisma;
        this.aiQueue = aiQueue;
        this.chatGateway = chatGateway;
        this.messagingService = messagingService;
        this.automationsService = automationsService;
        this.whatsappService = whatsappService;
        this.aiService = aiService;
        this.logger = new common_1.Logger(WebhookProcessor_1.name);
    }
    async process(job) {
        const { tenantId, webhookData, evolutionMetadata } = job.data;
        const entry = webhookData.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;
        const message = value?.messages?.[0];
        const contactInfo = value?.contacts?.[0];
        if (!message)
            return { status: 'ignored' };
        const messageId = message.id;
        const remoteJid = message.from;
        const fromMe = false;
        const pushName = contactInfo?.profile?.name || remoteJid;
        this.logger.debug(`Processando job [${job.id}] - Mensagem de ${remoteJid} (Tenant: ${tenantId})`);
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
        const getLocalBuffer = (url) => {
            if (!url)
                return null;
            try {
                const basename = path.basename(url);
                const folder = url.includes('/audio/') ? 'audio' : 'media';
                const candidate1 = path.join(process.cwd(), 'uploads', folder, basename);
                if (fs.existsSync(candidate1))
                    return fs.readFileSync(candidate1);
                const candidate2 = path.join(process.cwd(), 'uploads', 'audio', basename);
                if (fs.existsSync(candidate2))
                    return fs.readFileSync(candidate2);
                const candidate3 = path.join(process.cwd(), 'uploads', 'media', basename);
                if (fs.existsSync(candidate3))
                    return fs.readFileSync(candidate3);
                return null;
            }
            catch {
                return null;
            }
        };
        const isAudio = message.type === 'audio' ||
            message.type === 'voice' ||
            message.type === 'ptt' ||
            !!message.audio ||
            !!message.voice ||
            evolutionMetadata?.mediaType === 'audio';
        const isImage = message.type === 'image' ||
            !!message.image ||
            evolutionMetadata?.mediaType === 'image';
        const isDocument = message.type === 'document' ||
            !!message.document ||
            evolutionMetadata?.mediaType === 'document';
        let content = message.text?.body || '';
        let msgType = isAudio ? 'audio' : isImage ? 'image' : isDocument ? 'document' : (message.type || 'text');
        let mediaUrl = null;
        let audioTranscription = null;
        if (isAudio) {
            msgType = 'audio';
            const audioObj = message.audio || message.voice;
            const mediaId = audioObj?.id;
            const directUrl = audioObj?.link || audioObj?.url || evolutionMetadata?.mediaUrl;
            const mimeType = audioObj?.mime_type || evolutionMetadata?.mediaMime || 'audio/ogg';
            if (directUrl) {
                mediaUrl = directUrl;
            }
            else if (mediaId) {
                mediaUrl = await this.whatsappService.downloadAndSaveMedia(tenantId, mediaId, mimeType);
            }
            const audioBuffer = getLocalBuffer(mediaUrl);
            if (audioBuffer) {
                this.logger.log(`[Multimodal Audio] Transcrevendo áudio recebido de ${remoteJid}...`);
                const transcription = await this.aiService.transcribeAudio(audioBuffer, path.basename(mediaUrl || 'audio.ogg'), mimeType);
                if (transcription) {
                    audioTranscription = transcription;
                    content = `🎤 [Áudio]: "${transcription}"`;
                }
                else {
                    content = '🎤 Mensagem de voz';
                }
            }
            else {
                content = '🎤 Mensagem de voz';
            }
        }
        else if (isImage) {
            msgType = 'image';
            const imgObj = message.image;
            const mediaId = imgObj?.id;
            const directUrl = imgObj?.link || imgObj?.url || evolutionMetadata?.mediaUrl;
            const mimeType = imgObj?.mime_type || evolutionMetadata?.mediaMime || 'image/jpeg';
            const caption = imgObj?.caption || evolutionMetadata?.mediaCaption || message.text?.body || '';
            if (directUrl) {
                mediaUrl = directUrl;
            }
            else if (mediaId) {
                mediaUrl = await this.whatsappService.downloadAndSaveMedia(tenantId, mediaId, mimeType);
            }
            const imageBuffer = getLocalBuffer(mediaUrl);
            if (imageBuffer) {
                this.logger.log(`[Multimodal Vision] Analisando imagem recebida de ${remoteJid}...`);
                const visualAnalysis = await this.aiService.analyzeImage(imageBuffer, mimeType, caption);
                if (visualAnalysis) {
                    content = caption
                        ? `${caption}\n📷 [Análise da Imagem]: ${visualAnalysis}`
                        : `📷 [Análise da Imagem]: ${visualAnalysis}`;
                }
                else {
                    content = caption || '📷 Foto';
                }
            }
            else {
                content = caption || '📷 Foto';
            }
        }
        else if (isDocument) {
            msgType = 'document';
            const docObj = message.document;
            const mediaId = docObj?.id;
            const directUrl = docObj?.link || docObj?.url || evolutionMetadata?.mediaUrl;
            const mimeType = docObj?.mime_type || evolutionMetadata?.mediaMime || 'application/pdf';
            const caption = docObj?.caption || evolutionMetadata?.mediaCaption || message.text?.body || '';
            const filename = docObj?.filename || evolutionMetadata?.mediaFilename || 'documento.pdf';
            if (directUrl) {
                mediaUrl = directUrl;
            }
            else if (mediaId) {
                mediaUrl = await this.whatsappService.downloadAndSaveMedia(tenantId, mediaId, mimeType);
            }
            const docBuffer = getLocalBuffer(mediaUrl);
            if (docBuffer) {
                this.logger.log(`[Multimodal Doc] Extraindo texto do documento recebido de ${remoteJid}...`);
                const docText = await this.aiService.extractDocumentText(docBuffer, mimeType, filename);
                if (docText) {
                    content = caption
                        ? `${caption}\n📄 [Documento: ${filename}]:\n${docText}`
                        : `📄 [Documento: ${filename}]:\n${docText}`;
                }
                else {
                    content = caption || filename || '📄 Documento';
                }
            }
            else {
                content = caption || filename || '📄 Documento';
            }
        }
        else if (!content) {
            content = '[Mídia Recebida]';
        }
        if (evolutionMetadata?.realPhone && remoteJid.includes('@lid') && evolutionMetadata.realPhone !== remoteJid) {
            const existingLidContact = await this.prisma.contact.findUnique({
                where: { tenantId_phone: { tenantId, phone: remoteJid } }
            });
            if (existingLidContact) {
                await this.prisma.contact.update({
                    where: { id: existingLidContact.id },
                    data: { phone: evolutionMetadata.realPhone }
                }).catch(() => null);
            }
        }
        const phone = (evolutionMetadata?.realPhone && evolutionMetadata.realPhone.length >= 10)
            ? evolutionMetadata.realPhone
            : remoteJid;
        const rawPushName = pushName || evolutionMetadata?.pushName;
        const isGenericPushName = !rawPushName || rawPushName === 'Cliente WhatsApp' || rawPushName.includes('@lid') || rawPushName.startsWith('WhatsApp');
        const cleanName = !isGenericPushName
            ? rawPushName
            : (phone.includes('@lid') ? 'Cliente WhatsApp' : `WhatsApp (${phone})`);
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
        const isGenericContact = !contact.name || contact.name === 'Cliente WhatsApp' || contact.name.includes('@lid') || contact.name.startsWith('WhatsApp');
        if (!contact.avatarUrl || isGenericContact) {
            try {
                const synced = await this.whatsappService.syncContactMetadata(tenantId, contact.id);
                if (synced?.avatarUrl)
                    contact.avatarUrl = synced.avatarUrl;
                if (synced?.name)
                    contact.name = synced.name;
            }
            catch (err) {
                this.logger.warn(`Erro na sincronização de perfil do contato ${contact.id}: ${err.message}`);
            }
        }
        const currentDay = new Date().getDay();
        const currentHourStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
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
        }
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
            update: {}
        });
        if (conversation.status === 'resolved' || conversation.status === 'closed') {
            conversation = await this.prisma.conversation.update({
                where: { id: conversation.id },
                data: { status: 'bot_active', assignedTo: null }
            });
            this.logger.log(`Conversa [${conversation.id}] reaberta (status -> bot_active, assignedTo -> null).`);
            this.chatGateway.emitConversationUpdated(tenantId, conversation);
        }
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
                audioTranscription,
                senderType: 'contact',
                status: 'delivered',
            }
        });
        this.logger.log(`Mensagem [${messageId}] salva com sucesso na conversa [${conversation.id}]`);
        if (conversation.status === 'waiting' || conversation.status === 'bot_active') {
            await this.automationsService.evaluateEvent(tenantId, 'NEW_CONVERSATION', {
                contactId: contact.id,
                conversationId: conversation.id
            });
        }
        await this.automationsService.evaluateEvent(tenantId, 'INACTIVITY', {
            contactId: contact.id,
            conversationId: conversation.id
        });
        this.chatGateway.emitNewMessage(tenantId, {
            ...savedMessage,
            contact: { phone: contact.phone, name: contact.name, avatarUrl: contact.avatarUrl }
        });
        if (conversation.status === 'bot_active') {
            const connectedInst = await this.prisma.whatsAppInstance.findFirst({
                where: { tenantId, status: 'connected' }
            });
            if (!connectedInst) {
                this.logger.warn(`Tenant [${tenantId}] sem WhatsApp conectado. Conversa [${conversation.id}] mantida como 'waiting' sem IA.`);
                await this.prisma.conversation.update({
                    where: { id: conversation.id },
                    data: { status: 'waiting' }
                });
                return { status: 'instance_disconnected' };
            }
            if (!isWithinBusinessHours) {
                this.logger.log(`Conversa [${conversation.id}] mantida sem IA por estar fora do expediente.`);
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
            const existingJob = await this.aiQueue.getJob(jobId);
            if (existingJob) {
                const state = await existingJob.getState();
                if (state === 'delayed' || state === 'waiting') {
                    await existingJob.remove();
                    this.logger.debug(`Debounce: Job anterior cancelado para conversa [${conversation.id}]`);
                }
            }
            await this.aiQueue.add('generate-reply', {
                tenantId,
                conversationId: conversation.id,
                contactId: contact.id,
            }, {
                jobId,
                delay: 10000,
                attempts: 2,
                backoff: { type: 'fixed', delay: 2000 }
            });
            this.logger.log(`Conversa [${conversation.id}] agendada para IA em 10 segundos (Buffer).`);
        }
        else {
            this.logger.log(`Conversa [${conversation.id}] ignorada pela IA. O status atual é Humano (${conversation.status}).`);
        }
        return { status: 'success', messageId: savedMessage.id };
    }
};
exports.WebhookProcessor = WebhookProcessor;
exports.WebhookProcessor = WebhookProcessor = WebhookProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('webhook-ingress'),
    __param(1, (0, bullmq_1.InjectQueue)('ai-processing')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bullmq_2.Queue,
        chat_gateway_1.ChatGateway,
        messaging_service_1.MessagingService,
        automations_service_1.AutomationsService,
        whatsapp_service_1.WhatsappService,
        ai_service_1.AiService])
], WebhookProcessor);
//# sourceMappingURL=webhook.processor.js.map