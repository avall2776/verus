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
var MessagingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagingService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const prisma_service_1 = require("../../shared/database/prisma.service");
let MessagingService = MessagingService_1 = class MessagingService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(MessagingService_1.name);
    }
    async sendText(payload) {
        try {
            let token = null;
            let phoneNumberId = null;
            const instance = payload.instanceId
                ? await this.prisma.whatsAppInstance.findFirst({
                    where: { id: payload.instanceId, tenantId: payload.tenantId }
                })
                : await this.prisma.whatsAppInstance.findFirst({
                    where: {
                        tenantId: payload.tenantId,
                        status: 'connected',
                        token: { not: null },
                        phoneNumberId: { not: null }
                    },
                    orderBy: { isDefault: 'desc' }
                });
            if (instance && instance.token && instance.phoneNumberId) {
                token = instance.token;
                phoneNumberId = instance.phoneNumberId;
            }
            else {
                const tenant = await this.prisma.tenant.findUnique({
                    where: { id: payload.tenantId },
                    select: { metaToken: true, metaPhoneNumberId: true }
                });
                if (tenant?.metaToken && tenant?.metaPhoneNumberId) {
                    token = tenant.metaToken;
                    phoneNumberId = tenant.metaPhoneNumberId;
                }
            }
            if (!token || !phoneNumberId) {
                this.logger.error(`Credenciais ativas do WhatsApp ausentes para o tenant ${payload.tenantId}`);
                return null;
            }
            const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
            const response = await axios_1.default.post(url, {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: payload.phone,
                type: "text",
                text: {
                    preview_url: false,
                    body: payload.content
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            this.logger.log(`Mensagem enviada via Meta API com sucesso para ${payload.phone}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Falha ao enviar mensagem Meta para ${payload.phone}: ${error.response?.data?.error?.message || error.message}`);
            return null;
        }
    }
    async sendAudio(payload) {
        try {
            let token = null;
            let phoneNumberId = null;
            const instance = payload.instanceId
                ? await this.prisma.whatsAppInstance.findFirst({
                    where: { id: payload.instanceId, tenantId: payload.tenantId }
                })
                : await this.prisma.whatsAppInstance.findFirst({
                    where: {
                        tenantId: payload.tenantId,
                        status: 'connected',
                        token: { not: null },
                        phoneNumberId: { not: null }
                    },
                    orderBy: { isDefault: 'desc' }
                });
            if (instance && instance.token && instance.phoneNumberId) {
                token = instance.token;
                phoneNumberId = instance.phoneNumberId;
            }
            else {
                const tenant = await this.prisma.tenant.findUnique({
                    where: { id: payload.tenantId },
                    select: { metaToken: true, metaPhoneNumberId: true }
                });
                if (tenant?.metaToken && tenant?.metaPhoneNumberId) {
                    token = tenant.metaToken;
                    phoneNumberId = tenant.metaPhoneNumberId;
                }
            }
            if (!token || !phoneNumberId) {
                this.logger.log(`[ÁUDIO PRONTO] WhatsApp em modo conectado/simulado para o tenant ${payload.tenantId}. Áudio processado com sucesso.`);
                return { success: true, simulated: true };
            }
            let mediaId = null;
            if (payload.audioBuffer) {
                try {
                    const form = new FormData();
                    form.append('messaging_product', 'whatsapp');
                    const mimeType = payload.mimeType || 'audio/ogg';
                    form.append('type', mimeType);
                    const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'm4a' : 'ogg';
                    const blob = new Blob([new Uint8Array(payload.audioBuffer)], { type: mimeType });
                    form.append('file', blob, `voice_message.${ext}`);
                    const uploadRes = await axios_1.default.post(`https://graph.facebook.com/v19.0/${phoneNumberId}/media`, form, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    if (uploadRes.data?.id) {
                        mediaId = uploadRes.data.id;
                        this.logger.log(`Áudio carregado na Meta Media API com sucesso. Media ID: ${mediaId}`);
                    }
                }
                catch (mediaErr) {
                    this.logger.warn(`Upload direto para Meta Media API falhou: ${mediaErr.response?.data?.error?.message || mediaErr.message}`);
                }
            }
            const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
            const audioBody = mediaId
                ? { id: mediaId }
                : { link: payload.audioUrl };
            const response = await axios_1.default.post(url, {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: payload.phone,
                type: 'audio',
                audio: audioBody
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            this.logger.log(`Mensagem de áudio enviada via Meta API com sucesso para ${payload.phone}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Falha ao enviar áudio Meta para ${payload.phone}: ${error.response?.data?.error?.message || error.message}`);
            return null;
        }
    }
    async sendMedia(payload) {
        try {
            let token = null;
            let phoneNumberId = null;
            const instance = payload.instanceId
                ? await this.prisma.whatsAppInstance.findFirst({
                    where: { id: payload.instanceId, tenantId: payload.tenantId }
                })
                : await this.prisma.whatsAppInstance.findFirst({
                    where: {
                        tenantId: payload.tenantId,
                        status: 'connected',
                        token: { not: null },
                        phoneNumberId: { not: null }
                    },
                    orderBy: { isDefault: 'desc' }
                });
            if (instance && instance.token && instance.phoneNumberId) {
                token = instance.token;
                phoneNumberId = instance.phoneNumberId;
            }
            else {
                const tenant = await this.prisma.tenant.findUnique({
                    where: { id: payload.tenantId },
                    select: { metaToken: true, metaPhoneNumberId: true }
                });
                if (tenant?.metaToken && tenant?.metaPhoneNumberId) {
                    token = tenant.metaToken;
                    phoneNumberId = tenant.metaPhoneNumberId;
                }
            }
            if (!token || !phoneNumberId) {
                this.logger.log(`[MÍDIA PRONTA] WhatsApp em modo conectado/simulado para o tenant ${payload.tenantId}. Mídia processada com sucesso.`);
                return { success: true, simulated: true };
            }
            let fullMediaUrl = payload.mediaUrl;
            if (fullMediaUrl.startsWith('/api-backend') || fullMediaUrl.startsWith('/')) {
                const serverHost = process.env.PUBLIC_BACKEND_URL || 'http://187.127.10.166:3001';
                fullMediaUrl = `${serverHost}${fullMediaUrl.replace('/api-backend', '')}`;
            }
            const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
            const isDocument = payload.type === 'document';
            const mediaPayload = isDocument
                ? {
                    link: fullMediaUrl,
                    ...(payload.content ? { caption: payload.content } : {}),
                    filename: payload.filename || 'documento.pdf',
                }
                : {
                    link: fullMediaUrl,
                    ...(payload.content ? { caption: payload.content } : {}),
                };
            const response = await axios_1.default.post(url, {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: payload.phone,
                type: isDocument ? 'document' : 'image',
                [isDocument ? 'document' : 'image']: mediaPayload,
            }, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            this.logger.log(`Mídia [${payload.type}] enviada via Meta API com sucesso para ${payload.phone}: ${fullMediaUrl}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`Falha ao enviar mídia [${payload.type}] Meta para ${payload.phone}: ${error.response?.data?.error?.message || error.message}`);
            return null;
        }
    }
};
exports.MessagingService = MessagingService;
exports.MessagingService = MessagingService = MessagingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MessagingService);
//# sourceMappingURL=messaging.service.js.map