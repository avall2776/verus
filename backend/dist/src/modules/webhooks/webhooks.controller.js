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
var WebhooksController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksController = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const prisma_service_1 = require("../../shared/database/prisma.service");
const chat_gateway_1 = require("../chat/chat.gateway");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
let WebhooksController = WebhooksController_1 = class WebhooksController {
    constructor(ingressQueue, prisma, chatGateway, whatsappService) {
        this.ingressQueue = ingressQueue;
        this.prisma = prisma;
        this.chatGateway = chatGateway;
        this.whatsappService = whatsappService;
        this.logger = new common_1.Logger(WebhooksController_1.name);
        this.META_VERIFY_TOKEN = 'versus_secreto_123';
    }
    verifyMetaWebhook(mode, token, challenge, res) {
        if (mode === 'subscribe' && token === this.META_VERIFY_TOKEN) {
            this.logger.log('Webhook Meta verificado com sucesso!');
            return res.status(200).send(challenge);
        }
        return res.sendStatus(403);
    }
    async handleMetaWebhook(tenantId, payload) {
        this.logger.log(`Recebendo POST da Meta para o tenant: ${tenantId}`);
        const metaTenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true, name: true, isActive: true },
        });
        if (!metaTenant || metaTenant.isActive === false) {
            this.logger.warn(`Webhook Meta ignorado: Empresa [${metaTenant?.name || tenantId}] está BLOQUEADA/INATIVA.`);
            return { status: 'tenant_inactive_ignored' };
        }
        const entry = payload.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;
        const statuses = value?.statuses;
        if (statuses && Array.isArray(statuses) && statuses.length > 0) {
            for (const st of statuses) {
                const externalId = st.id;
                const rawStatus = st.status;
                let mappedStatus = rawStatus;
                if (st.errors && st.errors.length > 0) {
                    mappedStatus = 'failed';
                    this.logger.error(`Erro retornado pela Meta para a mensagem ${externalId}: ${JSON.stringify(st.errors)}`);
                }
                try {
                    const msg = await this.prisma.message.findFirst({
                        where: {
                            tenantId,
                            providerMessageId: externalId,
                        },
                    });
                    if (msg) {
                        const statusWeight = {
                            pending: 1,
                            sent: 2,
                            delivered: 3,
                            read: 4,
                            failed: 5,
                        };
                        const currentWeight = statusWeight[msg.status] || 0;
                        const newWeight = statusWeight[mappedStatus] || 0;
                        if (newWeight >= currentWeight || mappedStatus === 'failed') {
                            await this.prisma.message.update({
                                where: { id: msg.id },
                                data: { status: mappedStatus },
                            });
                            this.chatGateway.emitMessageStatusUpdated(tenantId, {
                                messageId: msg.id,
                                providerMessageId: externalId,
                                status: mappedStatus,
                                conversationId: msg.conversationId,
                            });
                            this.logger.log(`Status Meta atualizado: msg [${msg.id}] -> ${mappedStatus}`);
                        }
                    }
                }
                catch (statusErr) {
                    this.logger.error(`Erro ao atualizar status Meta da mensagem ${externalId}: ${statusErr.message}`);
                }
            }
            return { status: 'statuses_processed' };
        }
        const message = value?.messages?.[0];
        if (!message) {
            return { status: 'ignored', reason: 'Not a message or status event' };
        }
        await this.ingressQueue.add('process-meta-message', {
            tenantId,
            webhookData: payload,
        }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
            jobId: `msg_${message.id}`,
        });
        return { status: 'queued' };
    }
    async handleEvolutionWebhookDefault(payload) {
        const instanceName = payload.instance || payload.data?.instance;
        let tenantId = null;
        if (instanceName && instanceName.startsWith('versus_')) {
            const parts = instanceName.split('_');
            const cleanPrefix = parts[1];
            if (cleanPrefix) {
                const allTenants = await this.prisma.tenant.findMany({ select: { id: true } });
                const matched = allTenants.find(t => t.id.replace(/[^a-zA-Z0-9]/g, '').startsWith(cleanPrefix));
                if (matched) {
                    tenantId = matched.id;
                }
            }
        }
        if (!tenantId && instanceName) {
            const inst = await this.prisma.whatsAppInstance.findFirst({
                where: {
                    OR: [
                        { name: instanceName },
                        { name: `${instanceName} (WhatsApp Web)` },
                        { settings: { path: ['instanceName'], equals: instanceName } },
                    ],
                },
                select: { tenantId: true },
            });
            if (inst?.tenantId) {
                tenantId = inst.tenantId;
            }
        }
        if (!tenantId) {
            this.logger.warn(`Webhook Evolution ignorado: não foi possível identificar o tenant da instância [${instanceName}]`);
            return { status: 'ignored_unresolved_tenant' };
        }
        return this.handleEvolutionWebhook(tenantId, payload);
    }
    async handleEvolutionWebhook(tenantId, payload) {
        const instanceName = payload.instance || payload.data?.instance;
        let resolvedTenantId = tenantId;
        if (instanceName && instanceName.startsWith('versus_')) {
            const parts = instanceName.split('_');
            const cleanPrefix = parts[1];
            if (cleanPrefix) {
                const allTenants = await this.prisma.tenant.findMany({ select: { id: true } });
                const matched = allTenants.find(t => t.id.replace(/[^a-zA-Z0-9]/g, '').startsWith(cleanPrefix));
                if (matched) {
                    resolvedTenantId = matched.id;
                }
            }
        }
        if (resolvedTenantId === tenantId && instanceName) {
            const inst = await this.prisma.whatsAppInstance.findFirst({
                where: {
                    OR: [
                        { name: instanceName },
                        { name: `${instanceName} (WhatsApp Web)` },
                        { settings: { path: ['instanceName'], equals: instanceName } },
                    ],
                },
                select: { tenantId: true },
            });
            if (inst?.tenantId) {
                resolvedTenantId = inst.tenantId;
            }
        }
        tenantId = resolvedTenantId;
        const event = payload.event;
        this.logger.log(`Recebendo webhook Evolution API [${event}] para tenant: ${tenantId}`);
        const evoTenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true, name: true, isActive: true },
        });
        if (!evoTenant || evoTenant.isActive === false) {
            this.logger.warn(`Webhook Evolution ignorado: Empresa [${evoTenant?.name || tenantId}] está BLOQUEADA/INATIVA.`);
            return { status: 'tenant_inactive_ignored' };
        }
        if (event === 'connection.update' || event === 'CONNECTION_UPDATE') {
            const instanceName = payload.instance || payload.data?.instance;
            const state = payload.data?.state || payload.state;
            const statusReason = payload.data?.statusReason;
            const rawSender = payload.sender || payload.data?.sender || payload.data?.owner || '';
            const phone = rawSender ? String(rawSender).replace(/\D/g, '') : null;
            this.logger.log(`⚡ [Evolution Webhook] Handshake WhatsApp: [${instanceName}] -> state=${state}, phone=${phone}, reason=${statusReason}`);
            const instances = await this.prisma.whatsAppInstance.findMany({
                where: { tenantId }
            });
            const matchedInstance = instances.find(inst => {
                const set = inst.settings || {};
                return set.instanceName === instanceName || inst.name === instanceName || inst.name === `${instanceName} (WhatsApp Web)`;
            }) || instances.find(inst => inst.isDefault) || instances[0];
            if (matchedInstance) {
                if (state === 'open') {
                    const updated = await this.prisma.whatsAppInstance.update({
                        where: { id: matchedInstance.id },
                        data: {
                            status: 'connected',
                            phoneNumber: phone || matchedInstance.phoneNumber,
                            qrCode: null,
                            lastConnectedAt: new Date(),
                        },
                    });
                    await this.prisma.whatsAppConnectionHistory.create({
                        data: {
                            instanceId: matchedInstance.id,
                            status: 'connected',
                            details: `Dispositivo autenticado com sucesso pelo WhatsApp Business. Número: ${phone || 'Ativo'}`
                        }
                    });
                    this.chatGateway.emitWhatsAppStatusUpdated(tenantId, updated);
                    this.logger.log(`✅ [WhatsApp Conectado] Instância [${matchedInstance.id}] confirmada e ativa para tenant ${tenantId}!`);
                }
                else if (state === 'close') {
                    const updated = await this.prisma.whatsAppInstance.update({
                        where: { id: matchedInstance.id },
                        data: {
                            status: 'disconnected',
                            qrCode: null,
                        },
                    });
                    await this.prisma.whatsAppConnectionHistory.create({
                        data: {
                            instanceId: matchedInstance.id,
                            status: 'disconnected',
                            details: statusReason
                                ? `Sessão encerrada pelo WhatsApp (Código: ${statusReason})`
                                : 'Sessão encerrada / Desconectado pelo WhatsApp'
                        }
                    });
                    this.chatGateway.emitWhatsAppStatusUpdated(tenantId, updated);
                    this.logger.warn(`🔌 [WhatsApp Desconectado] Instância [${matchedInstance.id}] desconectada. Motivo: ${statusReason || 'close'}`);
                }
                else if (state === 'connecting') {
                    this.chatGateway.emitWhatsAppStatusUpdated(tenantId, {
                        ...matchedInstance,
                        status: 'connecting',
                    });
                }
            }
            return { status: 'connection_update_processed', state };
        }
        if (event === 'qrcode.updated' || event === 'QRCODE_UPDATED') {
            const instanceName = payload.instance || payload.data?.instance;
            const qrcodeObj = payload.data?.qrcode || payload.data;
            const qrCode = qrcodeObj?.base64 || qrcodeObj?.code || payload.base64 || payload.code;
            if (qrCode) {
                const instances = await this.prisma.whatsAppInstance.findMany({
                    where: { tenantId }
                });
                const matchedInstance = instances.find(inst => {
                    const set = inst.settings || {};
                    return set.instanceName === instanceName || inst.name === instanceName || inst.name === `${instanceName} (WhatsApp Web)`;
                }) || instances.find(inst => inst.isDefault) || instances[0];
                if (matchedInstance && matchedInstance.status !== 'connected') {
                    const updated = await this.prisma.whatsAppInstance.update({
                        where: { id: matchedInstance.id },
                        data: {
                            status: 'qrcode',
                            qrCode,
                        },
                    });
                    this.chatGateway.emitWhatsAppStatusUpdated(tenantId, updated);
                    this.logger.log(`🔄 [WhatsApp QR Code] Novo hash QR Code emitido para instância [${matchedInstance.id}].`);
                }
            }
            return { status: 'qrcode_updated_processed' };
        }
        if (event === 'messages.update' || event === 'MESSAGES_UPDATE') {
            const updates = Array.isArray(payload.data) ? payload.data : [payload.data];
            for (const item of updates) {
                const keyId = item?.key?.id || item?.id;
                const rawStatus = item?.update?.status || item?.status;
                if (!keyId || !rawStatus)
                    continue;
                let mappedStatus = 'sent';
                const s = String(rawStatus).toUpperCase();
                if (s.includes('READ') || s.includes('PLAYED')) {
                    mappedStatus = 'read';
                }
                else if (s.includes('DELIVERY') || s.includes('DELIVERED')) {
                    mappedStatus = 'delivered';
                }
                else if (s.includes('SERVER') || s.includes('SENT') || s.includes('RECEIPT')) {
                    mappedStatus = 'sent';
                }
                else if (s.includes('ERROR') || s.includes('FAIL')) {
                    mappedStatus = 'failed';
                }
                try {
                    const msg = await this.prisma.message.findFirst({
                        where: {
                            tenantId,
                            providerMessageId: keyId,
                        },
                    });
                    if (msg) {
                        const statusWeight = {
                            pending: 1,
                            sent: 2,
                            delivered: 3,
                            read: 4,
                            failed: 5,
                        };
                        const currentWeight = statusWeight[msg.status] || 0;
                        const newWeight = statusWeight[mappedStatus] || 0;
                        if (newWeight >= currentWeight || mappedStatus === 'failed') {
                            await this.prisma.message.update({
                                where: { id: msg.id },
                                data: { status: mappedStatus },
                            });
                            this.chatGateway.emitMessageStatusUpdated(tenantId, {
                                messageId: msg.id,
                                providerMessageId: keyId,
                                status: mappedStatus,
                                conversationId: msg.conversationId,
                            });
                            this.logger.log(`Status Evolution atualizado: msg [${msg.id}] -> ${mappedStatus}`);
                        }
                    }
                }
                catch (err) {
                    this.logger.error(`Erro ao atualizar status Evolution da mensagem ${keyId}: ${err.message}`);
                }
            }
            return { status: 'evolution_status_processed' };
        }
        if (event === 'send.message' || event === 'SEND_MESSAGE') {
            const keyId = payload.data?.key?.id;
            if (keyId) {
                try {
                    const msg = await this.prisma.message.findFirst({
                        where: { tenantId, providerMessageId: keyId },
                    });
                    if (msg && msg.status === 'pending') {
                        await this.prisma.message.update({
                            where: { id: msg.id },
                            data: { status: 'sent' },
                        });
                        this.chatGateway.emitMessageStatusUpdated(tenantId, {
                            messageId: msg.id,
                            providerMessageId: keyId,
                            status: 'sent',
                            conversationId: msg.conversationId,
                        });
                    }
                }
                catch (e) { }
            }
            return { status: 'evolution_send_processed' };
        }
        if (event === 'messages.upsert' || event === 'MESSAGES_UPSERT') {
            const data = payload.data;
            const messageObj = data?.message;
            const key = data?.key;
            if (!key) {
                return { status: 'ignored_no_key' };
            }
            const isFromMe = Boolean(key.fromMe);
            const remoteJid = (key.remoteJid || '').replace('@s.whatsapp.net', '');
            let realPhone = null;
            if (remoteJid.includes('@lid')) {
                const candidatePn = key.participantPn ||
                    data?.participantPn ||
                    data?.senderPn ||
                    key.senderPn ||
                    key.remoteJidAlt ||
                    data?.sender ||
                    data?.senderId ||
                    data?.key?.participant;
                if (candidatePn && typeof candidatePn === 'string') {
                    const cleanPn = candidatePn.replace('@s.whatsapp.net', '').replace('@lid', '').replace(/\D/g, '');
                    if (cleanPn.length >= 10 && cleanPn.length <= 13) {
                        realPhone = cleanPn;
                    }
                }
            }
            else {
                const cleanDigits = remoteJid.replace(/\D/g, '');
                if (cleanDigits.length >= 10 && cleanDigits.length <= 13) {
                    realPhone = cleanDigits;
                }
            }
            const textBody = messageObj?.conversation ||
                messageObj?.extendedTextMessage?.text ||
                '';
            const candidateName = data.pushName || data.verifiedBizName || data.verifiedName;
            const contactDisplayName = candidateName && !candidateName.includes('@lid')
                ? candidateName
                : (realPhone ? realPhone : (remoteJid.includes('@lid') ? 'Cliente WhatsApp' : remoteJid));
            const isAudio = !!messageObj?.audioMessage ||
                data?.messageType === 'audioMessage' ||
                !!messageObj?.ptt ||
                !!data?.audioMessage;
            const isImage = !!messageObj?.imageMessage ||
                data?.messageType === 'imageMessage' ||
                !!data?.imageMessage;
            const docObj = messageObj?.documentMessage ||
                messageObj?.documentWithCaptionMessage?.message?.documentMessage ||
                data?.documentMessage;
            const isDocument = !!docObj || data?.messageType === 'documentMessage';
            let mediaType = 'text';
            let mediaMime = 'application/octet-stream';
            let mediaCaption = '';
            let mediaFilename = '';
            let mediaBase64 = data?.base64 || messageObj?.base64;
            if (isAudio) {
                mediaType = 'audio';
                const audioData = messageObj?.audioMessage || data?.audioMessage || messageObj?.ptt;
                mediaMime = audioData?.mimetype || 'audio/ogg';
                mediaBase64 = mediaBase64 || audioData?.base64;
            }
            else if (isImage) {
                mediaType = 'image';
                const imgData = messageObj?.imageMessage || data?.imageMessage;
                mediaMime = imgData?.mimetype || 'image/jpeg';
                mediaCaption = imgData?.caption || '';
                mediaBase64 = mediaBase64 || imgData?.base64;
            }
            else if (isDocument) {
                mediaType = 'document';
                mediaMime = docObj?.mimetype || 'application/pdf';
                mediaCaption = docObj?.caption || '';
                mediaFilename = docObj?.fileName || docObj?.title || 'documento.pdf';
                mediaBase64 = mediaBase64 || docObj?.base64;
            }
            const rawInstName = payload.instance || payload.data?.instance;
            const instName = rawInstName ? rawInstName.replace(' (WhatsApp Web)', '').trim() : '';
            if (mediaType !== 'text' && !mediaBase64 && instName) {
                mediaBase64 = await this.whatsappService.getBase64FromEvolutionMedia(instName, messageObj, key);
            }
            let savedMediaInfo = null;
            if (mediaBase64) {
                savedMediaInfo = await this.whatsappService.saveBase64Media(tenantId, mediaBase64, key.id, mediaMime, mediaFilename);
            }
            const mediaUrl = savedMediaInfo?.url || null;
            const normalizedPayload = {
                entry: [
                    {
                        changes: [
                            {
                                value: {
                                    messaging_product: 'whatsapp',
                                    contacts: [
                                        {
                                            profile: { name: contactDisplayName },
                                            wa_id: realPhone || remoteJid,
                                        },
                                    ],
                                    messages: [
                                        {
                                            from: realPhone || remoteJid,
                                            id: key.id,
                                            timestamp: String(data.messageTimestamp || Math.floor(Date.now() / 1000)),
                                            type: mediaType,
                                            text: textBody ? { body: textBody } : undefined,
                                            audio: isAudio ? { link: mediaUrl, id: key.id, mime_type: mediaMime } : undefined,
                                            image: isImage ? { link: mediaUrl, id: key.id, caption: mediaCaption, mime_type: mediaMime } : undefined,
                                            document: isDocument ? { link: mediaUrl, id: key.id, caption: mediaCaption, filename: mediaFilename, mime_type: mediaMime } : undefined,
                                            fromMe: isFromMe,
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                ],
            };
            await this.ingressQueue.add('process-meta-message', {
                tenantId,
                webhookData: normalizedPayload,
                evolutionMetadata: {
                    instanceName: instName,
                    pushName: candidateName,
                    remoteJid: key.remoteJid,
                    realPhone: realPhone,
                    profilePictureUrl: data.profilePictureUrl || null,
                    mediaUrl: mediaUrl,
                    mediaType: mediaType,
                    mediaMime: mediaMime,
                    mediaCaption: mediaCaption,
                    mediaFilename: mediaFilename,
                    localFilePath: savedMediaInfo?.filePath || null,
                    fromMe: isFromMe,
                },
            }, {
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
                jobId: `msg_${key.id}`,
            });
            return { status: 'queued' };
        }
        if (event === 'contacts.upsert' || event === 'CONTACTS_UPSERT') {
            const contactsList = Array.isArray(payload.data) ? payload.data : [payload.data];
            for (const c of contactsList) {
                const id = c?.id || c?.remoteJid || '';
                const phone = id.replace('@s.whatsapp.net', '');
                const pushName = c?.pushName || c?.verifiedName || c?.name;
                const profilePictureUrl = c?.profilePictureUrl || null;
                if (phone && pushName && !pushName.includes('@lid')) {
                    try {
                        await this.prisma.contact.updateMany({
                            where: { tenantId, phone },
                            data: {
                                name: pushName,
                                ...(profilePictureUrl ? { avatarUrl: profilePictureUrl } : {}),
                            },
                        });
                        const updated = await this.prisma.contact.findFirst({ where: { tenantId, phone } });
                        if (updated) {
                            this.chatGateway.emitContactUpdated(tenantId, updated);
                        }
                    }
                    catch (e) { }
                }
            }
            return { status: 'contacts_upsert_processed' };
        }
        return { status: 'ignored_unhandled_event' };
    }
};
exports.WebhooksController = WebhooksController;
__decorate([
    (0, common_1.Get)('meta/:tenantId'),
    __param(0, (0, common_1.Query)('hub.mode')),
    __param(1, (0, common_1.Query)('hub.verify_token')),
    __param(2, (0, common_1.Query)('hub.challenge')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], WebhooksController.prototype, "verifyMetaWebhook", null);
__decorate([
    (0, common_1.Post)('meta/:tenantId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleMetaWebhook", null);
__decorate([
    (0, common_1.Post)('evolution'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleEvolutionWebhookDefault", null);
__decorate([
    (0, common_1.Post)('evolution/:tenantId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('tenantId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebhooksController.prototype, "handleEvolutionWebhook", null);
exports.WebhooksController = WebhooksController = WebhooksController_1 = __decorate([
    (0, common_1.Controller)('webhooks'),
    __param(0, (0, bullmq_1.InjectQueue)('webhook-ingress')),
    __metadata("design:paramtypes", [bullmq_2.Queue,
        prisma_service_1.PrismaService,
        chat_gateway_1.ChatGateway,
        whatsapp_service_1.WhatsappService])
], WebhooksController);
//# sourceMappingURL=webhooks.controller.js.map