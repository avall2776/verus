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
    sanitizePhone(phone) {
        let clean = (phone || '').replace(/\D/g, '');
        if (clean.length === 10 || clean.length === 11) {
            clean = '55' + clean;
        }
        return clean;
    }
    async resolveConnection(tenantId, instanceId) {
        let instance = null;
        if (instanceId) {
            instance = await this.prisma.whatsAppInstance.findFirst({
                where: { id: instanceId, tenantId },
            });
        }
        if (!instance) {
            instance = await this.prisma.whatsAppInstance.findFirst({
                where: { tenantId, status: 'connected' },
                orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
            });
        }
        if (!instance) {
            instance = await this.prisma.whatsAppInstance.findFirst({
                where: { tenantId },
                orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
            });
        }
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { metaToken: true, metaPhoneNumberId: true },
        });
        const evolutionUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8080';
        const evolutionGlobalKey = process.env.EVOLUTION_API_KEY || 'verto123';
        const isEvolution = instance?.settings?.provider === 'evolution' ||
            instance?.name?.toUpperCase().includes('PROSPECTOR') ||
            instance?.token === 'verto123' ||
            (!instance?.phoneNumberId && !tenant?.metaPhoneNumberId);
        const hasMetaCreds = !!((instance?.token && instance?.phoneNumberId && instance.token.startsWith('EAA')) ||
            (tenant?.metaToken && tenant?.metaPhoneNumberId && tenant.metaToken.startsWith('EAA')));
        const metaToken = (instance?.token && instance.token.startsWith('EAA')) ? instance.token : (tenant?.metaToken || null);
        const metaPhoneNumberId = instance?.phoneNumberId || tenant?.metaPhoneNumberId || null;
        const preferredProvider = isEvolution || !hasMetaCreds ? 'evolution' : 'meta';
        const evolutionInstanceName = instance?.settings?.instanceName ||
            (instance?.name?.includes('PROSPECTOR') ? 'PROSPECTOR' : (instance?.name || 'PROSPECTOR'));
        const evolutionApiKey = instance?.token || evolutionGlobalKey;
        return {
            instance,
            preferredProvider,
            evolution: {
                url: evolutionUrl,
                apiKey: evolutionApiKey,
                instanceName: evolutionInstanceName,
            },
            meta: {
                token: metaToken,
                phoneNumberId: metaPhoneNumberId,
            },
        };
    }
    async sendText(payload) {
        const cleanPhone = this.sanitizePhone(payload.phone);
        if (!cleanPhone) {
            this.logger.error(`Número de telefone inválido para envio de texto no tenant ${payload.tenantId}`);
            return { success: false, error: 'Telefone inválido' };
        }
        const conn = await this.resolveConnection(payload.tenantId, payload.instanceId);
        if (conn.preferredProvider === 'evolution') {
            const evoRes = await this.sendEvolutionText(conn.evolution, cleanPhone, payload.content);
            if (evoRes.success)
                return evoRes;
            if (conn.meta.token && conn.meta.phoneNumberId) {
                this.logger.warn(`Evolution API falhou para ${cleanPhone}, acionando fallback Meta API...`);
                const metaRes = await this.sendMetaText(conn.meta, cleanPhone, payload.content);
                if (metaRes.success)
                    return metaRes;
            }
            return evoRes;
        }
        else {
            const metaRes = await this.sendMetaText(conn.meta, cleanPhone, payload.content);
            if (metaRes.success)
                return metaRes;
            this.logger.warn(`Meta API falhou para ${cleanPhone}, acionando fallback Evolution API...`);
            const evoRes = await this.sendEvolutionText(conn.evolution, cleanPhone, payload.content);
            if (evoRes.success)
                return evoRes;
            return metaRes;
        }
    }
    async sendEvolutionText(evoConfig, cleanPhone, content) {
        try {
            const url = `${evoConfig.url}/message/sendText/${evoConfig.instanceName}`;
            this.logger.log(`Disparando mensagem Evolution API [${evoConfig.instanceName}] para ${cleanPhone}...`);
            const response = await axios_1.default.post(url, {
                number: cleanPhone,
                options: {
                    delay: 1200,
                    presence: 'composing',
                    linkPreview: false,
                },
                textMessage: {
                    text: content,
                },
            }, {
                headers: {
                    apikey: evoConfig.apiKey,
                    'Content-Type': 'application/json',
                },
                timeout: 15000,
            });
            const messageId = response.data?.key?.id || response.data?.id || `evo_${Date.now()}`;
            this.logger.log(`Mensagem enviada com sucesso via Evolution API para ${cleanPhone}. ID: ${messageId}`);
            return {
                success: true,
                messageId,
                provider: 'evolution',
                raw: response.data,
            };
        }
        catch (err) {
            const errorMsg = err.response?.data?.response?.message || err.response?.data?.message || err.message;
            this.logger.error(`Erro no envio Evolution API para ${cleanPhone}: ${JSON.stringify(errorMsg)}`);
            return { success: false, error: String(errorMsg) };
        }
    }
    async sendMetaText(metaConfig, cleanPhone, content) {
        if (!metaConfig.token || !metaConfig.phoneNumberId) {
            return { success: false, error: 'Credenciais Meta ausentes' };
        }
        try {
            const url = `https://graph.facebook.com/v19.0/${metaConfig.phoneNumberId}/messages`;
            this.logger.log(`Disparando mensagem Meta API para ${cleanPhone}...`);
            const response = await axios_1.default.post(url, {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: cleanPhone,
                type: 'text',
                text: {
                    preview_url: false,
                    body: content,
                },
            }, {
                headers: {
                    Authorization: `Bearer ${metaConfig.token}`,
                    'Content-Type': 'application/json',
                },
                timeout: 15000,
            });
            const messageId = response.data?.messages?.[0]?.id || `meta_${Date.now()}`;
            this.logger.log(`Mensagem enviada com sucesso via Meta API para ${cleanPhone}. ID: ${messageId}`);
            return {
                success: true,
                messageId,
                provider: 'meta',
                raw: response.data,
            };
        }
        catch (err) {
            const errorMsg = err.response?.data?.error?.message || err.message;
            this.logger.error(`Erro no envio Meta API para ${cleanPhone}: ${errorMsg}`);
            return { success: false, error: errorMsg };
        }
    }
    async sendMedia(payload) {
        const cleanPhone = this.sanitizePhone(payload.phone);
        if (!cleanPhone) {
            return { success: false, error: 'Telefone inválido' };
        }
        const conn = await this.resolveConnection(payload.tenantId, payload.instanceId);
        let fullMediaUrl = payload.mediaUrl;
        if (fullMediaUrl.startsWith('/api-backend') || fullMediaUrl.startsWith('/')) {
            const serverHost = process.env.PUBLIC_BACKEND_URL || 'http://187.127.10.166:3001';
            fullMediaUrl = `${serverHost}${fullMediaUrl.replace('/api-backend', '')}`;
        }
        if (conn.preferredProvider === 'evolution') {
            const evoRes = await this.sendEvolutionMedia(conn.evolution, cleanPhone, payload, fullMediaUrl);
            if (evoRes.success)
                return evoRes;
            if (conn.meta.token && conn.meta.phoneNumberId) {
                return this.sendMetaMedia(conn.meta, cleanPhone, payload, fullMediaUrl);
            }
            return evoRes;
        }
        else {
            const metaRes = await this.sendMetaMedia(conn.meta, cleanPhone, payload, fullMediaUrl);
            if (metaRes.success)
                return metaRes;
            return this.sendEvolutionMedia(conn.evolution, cleanPhone, payload, fullMediaUrl);
        }
    }
    async sendEvolutionMedia(evoConfig, cleanPhone, payload, fullMediaUrl) {
        try {
            const url = `${evoConfig.url}/message/sendMedia/${evoConfig.instanceName}`;
            const isDocument = payload.type === 'document';
            const fileName = payload.filename || (isDocument ? 'documento.pdf' : 'imagem.jpg');
            const response = await axios_1.default.post(url, {
                number: cleanPhone,
                options: {
                    delay: 1200,
                    presence: 'composing',
                },
                mediaMessage: {
                    mediatype: isDocument ? 'document' : 'image',
                    media: fullMediaUrl,
                    caption: payload.content || '',
                    fileName,
                },
            }, {
                headers: {
                    apikey: evoConfig.apiKey,
                    'Content-Type': 'application/json',
                },
                timeout: 20000,
            });
            const messageId = response.data?.key?.id || response.data?.id || `evo_media_${Date.now()}`;
            this.logger.log(`Mídia [${payload.type}] enviada via Evolution API para ${cleanPhone}. ID: ${messageId}`);
            return { success: true, messageId, provider: 'evolution', raw: response.data };
        }
        catch (err) {
            const errorMsg = err.response?.data?.response?.message || err.response?.data?.message || err.message;
            this.logger.error(`Erro ao enviar mídia Evolution API: ${JSON.stringify(errorMsg)}`);
            return { success: false, error: String(errorMsg) };
        }
    }
    async sendMetaMedia(metaConfig, cleanPhone, payload, fullMediaUrl) {
        if (!metaConfig.token || !metaConfig.phoneNumberId) {
            return { success: false, error: 'Credenciais Meta ausentes' };
        }
        try {
            const url = `https://graph.facebook.com/v19.0/${metaConfig.phoneNumberId}/messages`;
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
                to: cleanPhone,
                type: isDocument ? 'document' : 'image',
                [isDocument ? 'document' : 'image']: mediaPayload,
            }, {
                headers: {
                    Authorization: `Bearer ${metaConfig.token}`,
                    'Content-Type': 'application/json',
                },
                timeout: 20000,
            });
            const messageId = response.data?.messages?.[0]?.id || `meta_media_${Date.now()}`;
            this.logger.log(`Mídia [${payload.type}] enviada via Meta API para ${cleanPhone}. ID: ${messageId}`);
            return { success: true, messageId, provider: 'meta', raw: response.data };
        }
        catch (err) {
            const errorMsg = err.response?.data?.error?.message || err.message;
            this.logger.error(`Erro ao enviar mídia Meta API: ${errorMsg}`);
            return { success: false, error: errorMsg };
        }
    }
    async sendAudio(payload) {
        const cleanPhone = this.sanitizePhone(payload.phone);
        if (!cleanPhone) {
            return { success: false, error: 'Telefone inválido' };
        }
        const conn = await this.resolveConnection(payload.tenantId, payload.instanceId);
        let fullAudioUrl = payload.audioUrl;
        if (fullAudioUrl && (fullAudioUrl.startsWith('/api-backend') || fullAudioUrl.startsWith('/'))) {
            const serverHost = process.env.PUBLIC_BACKEND_URL || 'http://187.127.10.166:3001';
            fullAudioUrl = `${serverHost}${fullAudioUrl.replace('/api-backend', '')}`;
        }
        if (conn.preferredProvider === 'evolution') {
            const evoRes = await this.sendEvolutionAudio(conn.evolution, cleanPhone, payload, fullAudioUrl);
            if (evoRes.success)
                return evoRes;
            if (conn.meta.token && conn.meta.phoneNumberId) {
                return this.sendMetaAudio(conn.meta, cleanPhone, payload);
            }
            return evoRes;
        }
        else {
            const metaRes = await this.sendMetaAudio(conn.meta, cleanPhone, payload);
            if (metaRes.success)
                return metaRes;
            return this.sendEvolutionAudio(conn.evolution, cleanPhone, payload, fullAudioUrl);
        }
    }
    async sendEvolutionAudio(evoConfig, cleanPhone, payload, fullAudioUrl) {
        try {
            const url = `${evoConfig.url}/message/sendWhatsAppAudio/${evoConfig.instanceName}`;
            const audioData = payload.audioBuffer
                ? payload.audioBuffer.toString('base64')
                : fullAudioUrl;
            if (!audioData) {
                return { success: false, error: 'Buffer ou URL de áudio ausente' };
            }
            const response = await axios_1.default.post(url, {
                number: cleanPhone,
                options: {
                    delay: 1200,
                    presence: 'recording',
                    encoding: true,
                },
                audioMessage: {
                    audio: audioData,
                },
            }, {
                headers: {
                    apikey: evoConfig.apiKey,
                    'Content-Type': 'application/json',
                },
                timeout: 20000,
            });
            const messageId = response.data?.key?.id || response.data?.id || `evo_audio_${Date.now()}`;
            this.logger.log(`Áudio enviado com sucesso via Evolution API para ${cleanPhone}. ID: ${messageId}`);
            return { success: true, messageId, provider: 'evolution', raw: response.data };
        }
        catch (err) {
            const errorMsg = err.response?.data?.response?.message || err.response?.data?.message || err.message;
            this.logger.error(`Erro ao enviar áudio Evolution API: ${JSON.stringify(errorMsg)}`);
            return { success: false, error: String(errorMsg) };
        }
    }
    async sendMetaAudio(metaConfig, cleanPhone, payload) {
        if (!metaConfig.token || !metaConfig.phoneNumberId) {
            return { success: false, error: 'Credenciais Meta ausentes' };
        }
        try {
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
                    const uploadRes = await axios_1.default.post(`https://graph.facebook.com/v19.0/${metaConfig.phoneNumberId}/media`, form, {
                        headers: { Authorization: `Bearer ${metaConfig.token}` },
                        timeout: 15000,
                    });
                    if (uploadRes.data?.id) {
                        mediaId = uploadRes.data.id;
                    }
                }
                catch (mediaErr) {
                    this.logger.warn(`Upload áudio Meta Media API falhou: ${mediaErr.message}`);
                }
            }
            const url = `https://graph.facebook.com/v19.0/${metaConfig.phoneNumberId}/messages`;
            const audioBody = mediaId ? { id: mediaId } : { link: payload.audioUrl };
            const response = await axios_1.default.post(url, {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: cleanPhone,
                type: 'audio',
                audio: audioBody,
            }, {
                headers: {
                    Authorization: `Bearer ${metaConfig.token}`,
                    'Content-Type': 'application/json',
                },
                timeout: 15000,
            });
            const messageId = response.data?.messages?.[0]?.id || `meta_audio_${Date.now()}`;
            this.logger.log(`Áudio enviado com sucesso via Meta API para ${cleanPhone}. ID: ${messageId}`);
            return { success: true, messageId, provider: 'meta', raw: response.data };
        }
        catch (err) {
            const errorMsg = err.response?.data?.error?.message || err.message;
            this.logger.error(`Erro ao enviar áudio Meta API: ${errorMsg}`);
            return { success: false, error: errorMsg };
        }
    }
};
exports.MessagingService = MessagingService;
exports.MessagingService = MessagingService = MessagingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MessagingService);
//# sourceMappingURL=messaging.service.js.map