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
const notifications_service_1 = require("../../notifications/notifications.service");
let WebhookProcessor = WebhookProcessor_1 = class WebhookProcessor extends bullmq_1.WorkerHost {
    constructor(prisma, aiQueue, chatGateway, messagingService, automationsService, whatsappService, aiService, notificationsService) {
        super();
        this.prisma = prisma;
        this.aiQueue = aiQueue;
        this.chatGateway = chatGateway;
        this.messagingService = messagingService;
        this.automationsService = automationsService;
        this.whatsappService = whatsappService;
        this.aiService = aiService;
        this.notificationsService = notificationsService;
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
        const adReferral = message?.referral ||
            evolutionMetadata?.contextInfo?.externalAdReply ||
            message?.contextInfo?.externalAdReply ||
            message?.message?.extendedTextMessage?.contextInfo?.externalAdReply;
        const adCampaignName = adReferral?.headline || adReferral?.title || null;
        const detectedSource = adReferral ? 'Meta Ads' : 'WhatsApp';
        this.logger.debug(`Processando job [${job.id}] - Mensagem ${fromMe ? 'OUTBOUND (do celular)' : 'INBOUND'} de/para ${remoteJid} (Tenant: ${tenantId}, Origem: ${detectedSource})`);
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
        const isSticker = message.type === 'sticker' ||
            !!message.sticker ||
            evolutionMetadata?.mediaType === 'sticker';
        let content = message.text?.body || '';
        const isContact = evolutionMetadata?.mediaType === 'contact' ||
            message.type === 'contact' ||
            content.includes('👤 Contato') ||
            content.includes('BEGIN:VCARD');
        let msgType = isAudio ? 'audio' : isImage ? 'image' : isVideo ? 'video' : isLocation ? 'location' : isDocument ? 'document' : isContact ? 'contact' : isSticker ? 'sticker' : (message.type || 'text');
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
            content = '🎤 Mensagem de voz';
            audioTranscription = null;
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
            content = caption || '📷 Foto';
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
        else if (isSticker) {
            msgType = 'sticker';
            const stickerObj = message.sticker;
            const mediaId = stickerObj?.id;
            const directUrl = stickerObj?.link || stickerObj?.url || evolutionMetadata?.mediaUrl;
            const mimeType = stickerObj?.mime_type || evolutionMetadata?.mediaMime || 'image/webp';
            if (directUrl) {
                mediaUrl = directUrl;
            }
            else if (mediaId) {
                mediaUrl = await this.whatsappService.downloadAndSaveMedia(tenantId, mediaId, mimeType);
            }
            content = 'Figurinha';
        }
        else if (isContact) {
            msgType = 'contact';
            content = content || evolutionMetadata?.mediaCaption || message.text?.body || '👤 Contato compartilhado';
        }
        else if (!content) {
            content = '[Mídia Recebida]';
        }
        const isViewOnceMsg = Boolean(evolutionMetadata?.isViewOnce);
        if (isViewOnceMsg) {
            if (!content.includes('[Visualização única]')) {
                content = content ? `${content} [Visualização única]` : '[Visualização única]';
            }
        }
        const isLid = remoteJid.includes('@lid') || remoteJid.replace(/\D/g, '').length > 13;
        let realPhone = (evolutionMetadata?.realPhone && evolutionMetadata.realPhone.length >= 10 && evolutionMetadata.realPhone.length <= 13)
            ? evolutionMetadata.realPhone
            : null;
        const lidId = evolutionMetadata?.remoteJid || (isLid ? remoteJid : null);
        const isFromMe = Boolean(message?.fromMe || evolutionMetadata?.key?.fromMe);
        let contactSearchPushName = isFromMe ? undefined : (pushName || evolutionMetadata?.pushName);
        if (isFromMe && (isLid || (lidId && lidId.includes('@lid')))) {
            const dbLidContact = await this.prisma.contact.findFirst({
                where: { tenantId, OR: [{ whatsappLid: lidId || remoteJid }, { phone: lidId || remoteJid }] },
                select: { name: true }
            });
            if (dbLidContact?.name && !dbLidContact.name.includes('@lid') && dbLidContact.name !== 'Cliente WhatsApp' && !/^\d+$/.test(dbLidContact.name.replace(/\D/g, ''))) {
                contactSearchPushName = dbLidContact.name;
            }
        }
        let resolvedCustomerName = null;
        if (!realPhone && (isLid || (lidId && lidId.includes('@lid')))) {
            const resolved = await this.whatsappService.resolveContactFromEvolution(tenantId, evolutionMetadata?.instanceName, lidId || remoteJid, contactSearchPushName, evolutionMetadata?.profilePictureUrl);
            if (resolved.realPhone) {
                realPhone = resolved.realPhone;
            }
            if (resolved.realName) {
                resolvedCustomerName = resolved.realName;
            }
        }
        const phoneCandidates = new Set();
        const addPhoneVariants = (p) => {
            if (!p || p.includes('@lid'))
                return;
            const clean = p.replace(/\D/g, '');
            if (clean.length >= 8) {
                phoneCandidates.add(clean);
                phoneCandidates.add(`+${clean}`);
                if (clean.startsWith('55') && clean.length === 13) {
                    const without9 = clean.slice(0, 4) + clean.slice(5);
                    phoneCandidates.add(without9);
                    phoneCandidates.add(`+${without9}`);
                }
                else if (clean.startsWith('55') && clean.length === 12) {
                    const with9 = clean.slice(0, 4) + '9' + clean.slice(4);
                    phoneCandidates.add(with9);
                    phoneCandidates.add(`+${with9}`);
                }
            }
        };
        addPhoneVariants(remoteJid);
        addPhoneVariants(realPhone);
        const phoneOrFilters = Array.from(phoneCandidates).map(p => ({ phone: p }));
        let existingContact = await this.prisma.contact.findFirst({
            where: {
                tenantId,
                OR: [
                    ...(lidId ? [{ whatsappLid: lidId }, { phone: lidId }] : []),
                    ...phoneOrFilters,
                    ...(realPhone ? [{ whatsappLid: realPhone }] : []),
                ],
            },
        });
        const rawPushName = pushName || evolutionMetadata?.pushName;
        const effectiveCustomerPushName = isFromMe
            ? resolvedCustomerName
            : (resolvedCustomerName || rawPushName);
        const isBlacklistedName = (n) => {
            if (!n)
                return true;
            const lower = n.toLowerCase().trim();
            return (lower === '.' ||
                lower === '-' ||
                lower.includes('@lid') ||
                lower.startsWith('whatsapp') ||
                lower === 'cliente' ||
                lower === 'sem nome' ||
                lower === 'lead' ||
                lower === 'cliente whatsapp' ||
                lower === 'cliente verto' ||
                lower === 'verto' ||
                lower.includes('vertoagricola') ||
                lower.includes('verto agrícola') ||
                lower.includes('comercial verto') ||
                lower.includes('vallor'));
        };
        const isGenericPushName = isBlacklistedName(effectiveCustomerPushName);
        if (!existingContact && evolutionMetadata?.profilePictureUrl) {
            const photoId = this.whatsappService.extractPhotoId(evolutionMetadata.profilePictureUrl);
            if (photoId) {
                existingContact = await this.prisma.contact.findFirst({
                    where: {
                        tenantId,
                        avatarUrl: { contains: photoId },
                    },
                    orderBy: { updatedAt: 'desc' },
                });
            }
        }
        if (!existingContact && evolutionMetadata?.quotedInfo?.providerMessageId) {
            const quotedMsg = await this.prisma.message.findFirst({
                where: {
                    tenantId,
                    providerMessageId: evolutionMetadata.quotedInfo.providerMessageId,
                },
                include: {
                    conversation: {
                        include: { contact: true }
                    }
                },
            });
            if (quotedMsg?.conversation?.contact) {
                existingContact = quotedMsg.conversation.contact;
                this.logger.log(`🔗 [LID Quoted Match] Contato [${existingContact.id} - ${existingContact.name}] identificado via mensagem citada [${evolutionMetadata.quotedInfo.providerMessageId}]`);
            }
        }
        if (!existingContact && (isLid || (lidId && lidId.includes('@lid'))) && !isGenericPushName && effectiveCustomerPushName) {
            try {
                const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
                const recentOutboundMsgs = await this.prisma.message.findMany({
                    where: {
                        tenantId,
                        direction: 'OUTBOUND',
                        createdAt: { gte: thirtyMinutesAgo },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 15,
                    include: {
                        conversation: {
                            include: { contact: true }
                        }
                    }
                });
                const pushNorm = effectiveCustomerPushName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                const pushParts = pushNorm.split(/\s+/).filter(p => p.length >= 3);
                for (const rMsg of recentOutboundMsgs) {
                    const candidate = rMsg.conversation?.contact;
                    if (candidate && !candidate.whatsappLid) {
                        const candidateNorm = (candidate.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                        const matches = candidateNorm.includes(pushNorm) || pushNorm.includes(candidateNorm) ||
                            (pushParts.length >= 2 && pushParts.every(part => candidateNorm.includes(part)));
                        if (matches) {
                            existingContact = candidate;
                            this.logger.log(`🔗 [LID Lead Recente Match] Contato [${candidate.id} - ${candidate.name}] vinculado com seguranca ao LID [${lidId || remoteJid}] apos resposta a disparo recente.`);
                            break;
                        }
                    }
                }
            }
            catch (err) {
                this.logger.warn(`Erro no fallback LID lead recente: ${err.message}`);
            }
        }
        let contact;
        if (existingContact) {
            const dataToUpdate = {};
            if (lidId && !existingContact.whatsappLid && !isFromMe) {
                dataToUpdate.whatsappLid = lidId;
            }
            if (realPhone && (existingContact.phone?.includes('@lid') || existingContact.phone?.replace(/\D/g, '').length > 13)) {
                const existingReal = await this.prisma.contact.findFirst({
                    where: {
                        tenantId,
                        phone: realPhone,
                        id: { not: existingContact.id }
                    }
                });
                if (existingReal) {
                    await this.prisma.conversation.updateMany({
                        where: { contactId: existingContact.id },
                        data: { contactId: existingReal.id }
                    }).catch(() => { });
                    await this.prisma.message.updateMany({
                        where: { contactId: existingContact.id },
                        data: { contactId: existingReal.id }
                    }).catch(() => { });
                    await this.prisma.deal.updateMany({
                        where: { contactId: existingContact.id },
                        data: { contactId: existingReal.id }
                    }).catch(() => { });
                    await this.prisma.supportTicket.updateMany({
                        where: { contactId: existingContact.id },
                        data: { contactId: existingReal.id }
                    }).catch(() => { });
                    const realUpdate = {};
                    if (lidId && !existingReal.whatsappLid) {
                        realUpdate.whatsappLid = lidId;
                    }
                    if (evolutionMetadata?.profilePictureUrl && !existingReal.avatarUrl) {
                        realUpdate.avatarUrl = evolutionMetadata.profilePictureUrl;
                    }
                    if (Object.keys(realUpdate).length > 0) {
                        await this.prisma.contact.update({
                            where: { id: existingReal.id },
                            data: realUpdate
                        }).catch(() => { });
                    }
                    await this.prisma.contact.delete({ where: { id: existingContact.id } }).catch(() => { });
                    existingContact = existingReal;
                }
                else {
                    dataToUpdate.phone = realPhone;
                }
            }
            const isCurrentNameGeneric = !existingContact.name ||
                isBlacklistedName(existingContact.name) ||
                (/^\d+$/.test(existingContact.name.trim()) && existingContact.name.trim().length >= 8);
            if (!isGenericPushName && isCurrentNameGeneric) {
                dataToUpdate.name = effectiveCustomerPushName;
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
            let cleanName = effectiveCustomerPushName;
            if (!cleanName || isGenericPushName) {
                if (realPhone) {
                    cleanName = `WhatsApp (${realPhone})`;
                }
                else if (targetPhone.includes('@lid')) {
                    const cross = await this.whatsappService.resolveLidFromAllTenants(lidId || remoteJid);
                    cleanName = (!cross.realName || isBlacklistedName(cross.realName)) ? 'WhatsApp (Contato Direto)' : cross.realName;
                }
                else {
                    cleanName = `WhatsApp (${targetPhone})`;
                }
            }
            contact = await this.prisma.contact.create({
                data: {
                    tenantId,
                    phone: targetPhone,
                    whatsappLid: lidId || (isLid ? remoteJid : null),
                    name: cleanName,
                    source: detectedSource,
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
        const targetDeptId = await this.resolveDepartmentByPhone(tenantId, contact.phone || remoteJid, contact.state);
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
                departmentId: targetDeptId,
                status: initialStatus,
                assignedTo: null,
            },
            update: {},
            include: {
                department: {
                    select: { id: true, name: true, color: true }
                }
            }
        });
        if (!conversation.departmentId && targetDeptId) {
            conversation = await this.prisma.conversation.update({
                where: { id: conversation.id },
                data: { departmentId: targetDeptId },
                include: {
                    department: {
                        select: { id: true, name: true, color: true }
                    }
                }
            });
        }
        if (fromMe) {
            conversation = await this.prisma.conversation.update({
                where: { id: conversation.id },
                data: {
                    status: 'human_takeover',
                    updatedAt: new Date()
                },
                include: {
                    department: {
                        select: { id: true, name: true, color: true }
                    }
                }
            });
            try {
                const jobId = `ai_reply_${conversation.id}`;
                const existingJob = await this.aiQueue.getJob(jobId);
                if (existingJob) {
                    const state = await existingJob.getState();
                    if (state === 'delayed' || state === 'waiting') {
                        await existingJob.remove();
                        this.logger.log(`[fromMe] IA cancelada para a conversa [${conversation.id}] pois o atendente chamou/respondeu via WhatsApp`);
                    }
                }
            }
            catch (err) { }
            this.chatGateway.emitConversationUpdated(tenantId, conversation);
        }
        else if (conversation.status === 'resolved' || conversation.status === 'closed') {
            conversation = await this.prisma.conversation.update({
                where: { id: conversation.id },
                data: { status: initialStatus, assignedTo: null },
                include: {
                    department: {
                        select: { id: true, name: true, color: true }
                    }
                }
            });
            this.logger.log(`Conversa [${conversation.id}] reaberta (status -> ${initialStatus}, assignedTo -> null).`);
            this.chatGateway.emitConversationUpdated(tenantId, conversation);
        }
        let quotedMessageToSave = null;
        if (evolutionMetadata?.quotedInfo) {
            const qInfo = evolutionMetadata.quotedInfo;
            let matchedQuotedMsg = null;
            if (qInfo.providerMessageId) {
                matchedQuotedMsg = await this.prisma.message.findFirst({
                    where: {
                        tenantId,
                        providerMessageId: qInfo.providerMessageId,
                    },
                    include: { contact: true },
                });
            }
            if (matchedQuotedMsg) {
                quotedMessageToSave = {
                    id: matchedQuotedMsg.id,
                    providerMessageId: matchedQuotedMsg.providerMessageId,
                    content: matchedQuotedMsg.content,
                    type: matchedQuotedMsg.type,
                    mediaUrl: matchedQuotedMsg.mediaUrl,
                    direction: matchedQuotedMsg.direction,
                    senderType: matchedQuotedMsg.senderType,
                    senderName: matchedQuotedMsg.direction === 'INBOUND' ? (matchedQuotedMsg.contact?.name || 'Cliente') : 'Você',
                };
            }
            else if (qInfo.content || qInfo.providerMessageId) {
                quotedMessageToSave = {
                    providerMessageId: qInfo.providerMessageId,
                    content: qInfo.content,
                    senderName: 'WhatsApp',
                };
            }
        }
        if (isViewOnceMsg) {
            quotedMessageToSave = {
                ...(quotedMessageToSave || {}),
                isViewOnce: true,
            };
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
                quotedMessage: quotedMessageToSave,
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
            conversationId: conversation.id,
            departmentId: conversation.departmentId,
            department: conversation.department || null,
            assignedTo: conversation.assignedTo,
            contact: {
                id: contact.id,
                phone: contact.phone,
                name: contact.name,
                avatarUrl: contact.avatarUrl
            }
        });
        if (fromMe) {
            return { status: 'success_outbound_synced', messageId: savedMessage.id };
        }
        if (this.notificationsService) {
            const msgContent = savedMessage.content || (savedMessage.mediaUrl ? '📎 Arquivo/Mídia' : 'Nova mensagem recebida');
            const cleanContent = msgContent.length > 75 ? `${msgContent.substring(0, 75)}...` : msgContent;
            if (conversation.assignedTo) {
                this.notificationsService.sendPushToUser(tenantId, conversation.assignedTo, {
                    title: contact.name || 'Cliente',
                    body: cleanContent,
                    url: `/inbox?conversationId=${conversation.id}`,
                    tag: `msg_${conversation.id}`
                }).catch(() => { });
            }
            else if (conversation.departmentId) {
                const deptName = conversation.department?.name || 'Atendimento';
                this.notificationsService.sendPushToDepartment(tenantId, conversation.departmentId, {
                    title: `Novo atendimento na fila · ${deptName}`,
                    body: `${contact.name || 'Cliente'} aguarda atendimento: "${cleanContent}"`,
                    url: `/inbox?conversationId=${conversation.id}`,
                    tag: `msg_${conversation.id}`
                }).catch(() => { });
            }
        }
        const isHumanHandled = conversation.status === 'human_takeover' ||
            conversation.status === 'open' ||
            conversation.status === 'in_progress' ||
            Boolean(conversation.assignedTo);
        if (isHumanHandled) {
            const lastActivityTime = conversation.updatedAt ? new Date(conversation.updatedAt).getTime() : 0;
            const hoursSinceLastActivity = (Date.now() - lastActivityTime) / (1000 * 60 * 60);
            if (hoursSinceLastActivity >= 24 && isAiActiveForTenant) {
                this.logger.log(`[Auto-Timeout 24h] Conversa [${conversation.id}] sob atendimento humano inativa há ${hoursSinceLastActivity.toFixed(1)}h. Reativando IA para novo atendimento.`);
                conversation = await this.prisma.conversation.update({
                    where: { id: conversation.id },
                    data: { status: 'bot_active', assignedTo: null, updatedAt: new Date() },
                    include: {
                        department: {
                            select: { id: true, name: true, color: true }
                        }
                    }
                });
                this.chatGateway.emitConversationUpdated(tenantId, conversation);
            }
            else {
                this.logger.log(`[Human Protected] Conversa [${conversation.id}] sob atendimento humano ativo (status: ${conversation.status}, assignedTo: ${conversation.assignedTo}, última atividade há ${hoursSinceLastActivity.toFixed(1)}h). IA silenciada.`);
                return { status: 'success_human_protected', messageId: savedMessage.id };
            }
        }
        if (!isAiActiveForTenant) {
            this.logger.log(`Conversa [${conversation.id}] mantida para atendimento humano. O auto-atendimento por IA está DESLIGADO nas Configurações da Empresa.`);
            if (conversation.status === 'bot_active') {
                conversation = await this.prisma.conversation.update({
                    where: { id: conversation.id },
                    data: { status: 'waiting', updatedAt: new Date() },
                    include: {
                        department: {
                            select: { id: true, name: true, color: true }
                        }
                    }
                });
                this.chatGateway.emitConversationUpdated(tenantId, conversation);
            }
            return { status: 'success_ai_disabled_tenant', messageId: savedMessage.id };
        }
        else {
            if (conversation.status !== 'bot_active') {
                conversation = await this.prisma.conversation.update({
                    where: { id: conversation.id },
                    data: { status: 'bot_active', updatedAt: new Date() },
                    include: {
                        department: {
                            select: { id: true, name: true, color: true }
                        }
                    }
                });
                this.chatGateway.emitConversationUpdated(tenantId, conversation);
            }
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
                formName: adCampaignName,
                source: detectedSource,
            }, {
                jobId,
                delay: 800,
                attempts: 2,
                backoff: { type: 'fixed', delay: 2000 }
            });
            this.logger.log(`Conversa [${conversation.id}] agendada para IA em 800ms (Buffer).`);
        }
        return { status: 'success', messageId: savedMessage.id };
    }
    async resolveDepartmentByPhone(tenantId, phone, state) {
        if (!phone && !state)
            return null;
        try {
            const departments = await this.prisma.department.findMany({
                where: { tenantId },
                select: { id: true, name: true }
            });
            if (!departments || departments.length === 0)
                return null;
            const dddToRegion = {
                '51': 1, '53': 1, '54': 1, '55': 1,
                '47': 1, '48': 1, '49': 1,
                '41': 1, '42': 1, '43': 1, '44': 1, '45': 1, '46': 1,
                '67': 2, '65': 2, '66': 2,
                '91': 2, '93': 2, '94': 2, '69': 2, '95': 2, '68': 2, '92': 2, '97': 2, '96': 2,
                '62': 3, '64': 3, '61': 3,
                '31': 3, '32': 3, '33': 3, '34': 3, '35': 3, '37': 3, '38': 3,
                '11': 3, '12': 3, '13': 3, '14': 3, '15': 3, '16': 3, '17': 3, '18': 3, '19': 3,
                '21': 3, '22': 3, '24': 3, '27': 3, '28': 3,
                '63': 4, '71': 4, '73': 4, '74': 4, '75': 4, '77': 4,
                '98': 5, '99': 5, '86': 5, '89': 5,
                '85': 6, '88': 6, '84': 6, '83': 6, '79': 6, '81': 6, '87': 6, '82': 6
            };
            const ufToRegion = {
                'RS': 1, 'SC': 1, 'PR': 1,
                'MS': 2, 'MT': 2, 'PA': 2, 'RO': 2, 'RR': 2, 'AC': 2, 'AM': 2, 'AP': 2,
                'GO': 3, 'DF': 3, 'MG': 3, 'SP': 3, 'RJ': 3, 'ES': 3,
                'TO': 4, 'BA': 4,
                'MA': 5, 'PI': 5,
                'CE': 6, 'RN': 6, 'PB': 6, 'SE': 6, 'PE': 6, 'AL': 6
            };
            let targetRegionNum = null;
            if (phone && !phone.includes('@lid')) {
                const clean = phone.replace(/\D/g, '');
                let ddd = '';
                if (clean.startsWith('595')) {
                    targetRegionNum = 1;
                }
                else if (clean.length >= 10 && clean.length <= 13) {
                    const localPart = clean.startsWith('55') && clean.length >= 12 ? clean.slice(2) : clean;
                    if (localPart.length === 10 || localPart.length === 11) {
                        ddd = localPart.substring(0, 2);
                    }
                    else if (clean.length === 10 || clean.length === 11) {
                        ddd = clean.substring(0, 2);
                    }
                }
                if (ddd && dddToRegion[ddd]) {
                    targetRegionNum = dddToRegion[ddd];
                }
            }
            if (!targetRegionNum && state) {
                const uf = state.trim().toUpperCase();
                const byToken = departments.find(d => new RegExp(`(^|[^A-ZÀ-Ú])${uf}([^A-ZÀ-Ú]|$)`).test(d.name.toUpperCase()));
                if (byToken)
                    return byToken.id;
                if (ufToRegion[uf])
                    targetRegionNum = ufToRegion[uf];
            }
            if (targetRegionNum) {
                const matched = departments.find(d => {
                    const upper = d.name.toUpperCase();
                    return upper.includes(`REGIÃO ${targetRegionNum}`) || upper.includes(`REGIAO ${targetRegionNum}`);
                });
                if (matched)
                    return matched.id;
            }
        }
        catch (e) {
            this.logger.warn(`Erro ao resolver departamento por telefone: ${e.message}`);
        }
        return null;
    }
};
exports.WebhookProcessor = WebhookProcessor;
exports.WebhookProcessor = WebhookProcessor = WebhookProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('webhook-ingress'),
    __param(1, (0, bullmq_1.InjectQueue)('ai-processing')),
    __param(7, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        bullmq_2.Queue,
        chat_gateway_1.ChatGateway,
        messaging_service_1.MessagingService,
        automations_service_1.AutomationsService,
        whatsapp_service_1.WhatsappService,
        ai_service_1.AiService,
        notifications_service_1.NotificationsService])
], WebhookProcessor);
//# sourceMappingURL=webhook.processor.js.map