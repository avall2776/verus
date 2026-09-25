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
        const fromMe = Boolean(evolutionMetadata?.fromMe || message.fromMe || false);
        const pushName = contactInfo?.profile?.name || remoteJid;
        this.logger.debug(`Processando job [${job.id}] - Mensagem ${fromMe ? 'OUTBOUND (do celular)' : 'INBOUND'} de/para ${remoteJid} (Tenant: ${tenantId})`);
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
            if (evolutionMetadata?.localFilePath && fs.existsSync(evolutionMetadata.localFilePath)) {
                try {
                    return fs.readFileSync(evolutionMetadata.localFilePath);
                }
                catch { }
            }
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
        const isVideo = message.type === 'video' ||
            !!message.video ||
            evolutionMetadata?.mediaType === 'video';
        const isLocation = message.type === 'location' ||
            !!message.location ||
            evolutionMetadata?.mediaType === 'location';
        const isDocument = message.type === 'document' ||
            !!message.document ||
            evolutionMetadata?.mediaType === 'document';
        let content = message.text?.body || '';
        let msgType = isAudio ? 'audio' : isImage ? 'image' : isVideo ? 'video' : isLocation ? 'location' : isDocument ? 'document' : (message.type || 'text');
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
        else if (isVideo) {
            msgType = 'video';
            const vidObj = message.video;
            const mediaId = vidObj?.id;
            const directUrl = vidObj?.link || vidObj?.url || evolutionMetadata?.mediaUrl;
            const mimeType = vidObj?.mime_type || evolutionMetadata?.mediaMime || 'video/mp4';
            const caption = vidObj?.caption || evolutionMetadata?.mediaCaption || message.text?.body || '';
            if (directUrl) {
                mediaUrl = directUrl;
            }
            else if (mediaId) {
                mediaUrl = await this.whatsappService.downloadAndSaveMedia(tenantId, mediaId, mimeType);
            }
            content = caption ? `${caption}` : '📹 Vídeo';
        }
        else if (isLocation) {
            msgType = 'location';
            const locObj = message.location;
            const lat = locObj?.latitude;
            const lng = locObj?.longitude;
            const locName = locObj?.name || '';
            const locAddress = locObj?.address || '';
            mediaUrl = (lat !== undefined && lng !== undefined) ? `https://maps.google.com/?q=${lat},${lng}` : evolutionMetadata?.mediaUrl || null;
            content = locName ? `📍 ${locName}${locAddress ? ' - ' + locAddress : ''}` : (locAddress ? `📍 ${locAddress}` : (mediaUrl ? `📍 Localização no Mapa` : '📍 Localização compartilhada'));
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
        const isLid = remoteJid.includes('@lid');
        const realPhone = (evolutionMetadata?.realPhone && evolutionMetadata.realPhone.length >= 10)
            ? evolutionMetadata.realPhone
            : null;
        let existingContact = await this.prisma.contact.findFirst({
            where: {
                tenantId,
                OR: [
                    ...(isLid ? [{ whatsappLid: remoteJid }] : []),
                    { phone: remoteJid },
                    ...(realPhone ? [{ phone: realPhone }, { whatsappLid: realPhone }] : []),
                ],
            },
        });
        const rawPushName = pushName || evolutionMetadata?.pushName;
        const isGenericPushName = !rawPushName || rawPushName === 'Cliente WhatsApp' || rawPushName.includes('@lid') || rawPushName.startsWith('WhatsApp');
        let contact;
        if (existingContact) {
            const dataToUpdate = {};
            if (isLid && !existingContact.whatsappLid) {
                dataToUpdate.whatsappLid = remoteJid;
            }
            if (realPhone && existingContact.phone?.includes('@lid')) {
                dataToUpdate.phone = realPhone;
            }
            if (!isGenericPushName && (existingContact.name === 'Cliente WhatsApp' || existingContact.name?.includes('@lid'))) {
                dataToUpdate.name = rawPushName;
            }
            if (evolutionMetadata?.profilePictureUrl && !existingContact.avatarUrl) {
                dataToUpdate.avatarUrl = evolutionMetadata.profilePictureUrl;
            }
            if (Object.keys(dataToUpdate).length > 0) {
                contact = await this.prisma.contact.update({
                    where: { id: existingContact.id },
                    data: dataToUpdate,
                }).catch(() => existingContact);
            }
            else {
                contact = existingContact;
            }
        }
        else {
            const targetPhone = realPhone || remoteJid;
            const cleanName = !isGenericPushName
                ? rawPushName
                : (targetPhone.includes('@lid') ? 'Cliente WhatsApp' : `WhatsApp (${targetPhone})`);
            contact = await this.prisma.contact.create({
                data: {
                    tenantId,
                    phone: targetPhone,
                    whatsappLid: isLid ? remoteJid : null,
                    name: cleanName,
                    source: 'WhatsApp',
                    avatarUrl: (evolutionMetadata?.profilePictureUrl && !evolutionMetadata.profilePictureUrl.includes('unsplash.com')) ? evolutionMetadata.profilePictureUrl : null,
                },
            });
        }
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
            const contactPhone = contact.phone || remoteJid;
            this.logger.log(`Fora do horário comercial. Enviando fallback para ${contactPhone}.`);
            const fallbackMsg = "Olá! Nosso horário de atendimento é de segunda a sexta, das 08h às 18h. Já recebemos sua mensagem e retornaremos assim que nossa equipe iniciar o expediente!";
            await this.messagingService.sendText({
                tenantId,
                phone: contactPhone,
                content: fallbackMsg
            });
        }
        const currentTenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { aiEnabled: true, name: true }
        });
        const isAiActiveForTenant = currentTenant?.aiEnabled !== false;
        const initialStatus = isAiActiveForTenant ? 'bot_active' : 'waiting';
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
                status: initialStatus,
                assignedTo: null,
            },
            update: {}
        });
        if (fromMe) {
            if (conversation.status === 'bot_active' || conversation.status === 'waiting' || conversation.status === 'resolved' || conversation.status === 'closed') {
                conversation = await this.prisma.conversation.update({
                    where: { id: conversation.id },
                    data: { status: 'human_takeover', updatedAt: new Date() }
                });
                this.chatGateway.emitConversationUpdated(tenantId, conversation);
            }
            try {
                const jobId = `ai_reply_${conversation.id}`;
                const existingJob = await this.aiQueue.getJob(jobId);
                if (existingJob) {
                    const state = await existingJob.getState();
                    if (state === 'delayed' || state === 'waiting') {
                        await existingJob.remove();
                        this.logger.log(`[fromMe] IA interrompida para a conversa [${conversation.id}] pois o atendente respondeu via WhatsApp`);
                    }
                }
            }
            catch (err) { }
        }
        else if (conversation.status === 'resolved' || conversation.status === 'closed') {
            conversation = await this.prisma.conversation.update({
                where: { id: conversation.id },
                data: { status: initialStatus, assignedTo: null }
            });
            this.logger.log(`Conversa [${conversation.id}] reaberta (status -> ${initialStatus}, assignedTo -> null).`);
            this.chatGateway.emitConversationUpdated(tenantId, conversation);
        }
        const savedMessage = await this.prisma.message.create({
            data: {
                tenantId,
                conversationId: conversation.id,
                contactId: contact.id,
                providerMessageId: messageId,
                direction: fromMe ? 'OUTBOUND' : 'INBOUND',
                content,
                type: msgType,
                mediaUrl,
                audioTranscription,
                senderType: fromMe ? 'user' : 'contact',
                fromMe: fromMe,
                status: 'delivered',
            }
        });
        this.logger.log(`Mensagem [${messageId}] (${fromMe ? 'OUTBOUND direto do WhatsApp' : 'INBOUND'}) salva com sucesso na conversa [${conversation.id}]`);
        await this.prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() }
        }).catch(() => { });
        if (!fromMe) {
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
        }
        this.chatGateway.emitNewMessage(tenantId, {
            ...savedMessage,
            contact: { phone: contact.phone, name: contact.name, avatarUrl: contact.avatarUrl }
        });
        if (fromMe) {
            return { status: 'success_outbound_synced', messageId: savedMessage.id };
        }
        if (!isAiActiveForTenant) {
            this.logger.log(`Conversa [${conversation.id}] mantida para atendimento humano. O auto-atendimento por IA está DESLIGADO nas Configurações da Empresa.`);
            if (conversation.status === 'bot_active') {
                await this.prisma.conversation.update({
                    where: { id: conversation.id },
                    data: { status: 'waiting' }
                });
            }
        }
        else if (conversation.status === 'bot_active') {
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