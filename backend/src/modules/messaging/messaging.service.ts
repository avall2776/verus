import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../../shared/database/prisma.service';

export interface SendMessagePayload {
  tenantId: string;
  phone: string;
  content: string;
  instanceId?: string;
}

export interface SendAudioPayload {
  tenantId: string;
  phone: string;
  audioBuffer?: Buffer;
  audioUrl?: string;
  mimeType?: string;
  instanceId?: string;
}

export interface SendMediaPayload {
  tenantId: string;
  phone: string;
  type: 'image' | 'document';
  mediaUrl: string;
  content?: string;
  filename?: string;
  instanceId?: string;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  provider?: 'evolution' | 'meta' | 'simulated';
  error?: string;
  raw?: any;
}

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Limpa e formata o número de telefone:
   * Preserva identificadores JID especiais (como @lid do WhatsApp Privacy).
   * Remove caracteres não numéricos e garante DDI 55 caso seja número brasileiro com DDD (10 ou 11 dígitos)
   */
  public sanitizePhone(phone: string): string {
    if (!phone) return '';
    const trimmed = String(phone).trim();

    // Se for JID com @lid, preserva intacto para entrega via WhatsApp Baileys
    if (trimmed.includes('@lid')) {
      return trimmed;
    }

    // Se tiver sufixo JID comum, limpa
    let clean = trimmed.replace('@s.whatsapp.net', '').replace('@c.us', '');
    clean = clean.replace(/\D/g, '');

    if (clean.length === 10 || clean.length === 11) {
      clean = '55' + clean;
    }
    return clean;
  }

  /**
   * Resolve a instância ativa ou específica e define o driver (Evolution API ou Meta Cloud API)
   * Garante compatibilidade universal dual: Evolution API (QR Code / Baileys) e Meta Cloud API Oficial
   */
  private async resolveConnection(tenantId: string, instanceId?: string, targetPhone?: string) {
    let instance: any = null;

    if (instanceId) {
      instance = await this.prisma.whatsAppInstance.findFirst({
        where: { id: instanceId, tenantId },
      });
    }

    if (!instance) {
      // Prioriza instância conectada default, depois qualquer conectada, depois default
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

    // Se o número de destino for @lid, a API oficial da Meta rejeita por protocolo (somente Baileys/Evolution suporta)
    const isLidTarget = !!(targetPhone && targetPhone.includes('@lid'));

    const hasMetaCreds = !!(
      !isLidTarget &&
      ((instance?.token && instance?.phoneNumberId && instance.token.startsWith('EAA')) ||
       (tenant?.metaToken && tenant?.metaPhoneNumberId && tenant.metaToken.startsWith('EAA')))
    );

    // Se a instância tiver identificação explícita de Evolution API ou não tiver phoneNumberId da Meta
    const isEvolution =
      isLidTarget ||
      (instance?.settings as any)?.provider === 'evolution' ||
      instance?.name?.toUpperCase().includes('PROSPECTOR') ||
      instance?.token === 'verto123' ||
      !hasMetaCreds;

    const metaToken = (instance?.token && instance.token.startsWith('EAA')) ? instance.token : (tenant?.metaToken || null);
    const metaPhoneNumberId = instance?.phoneNumberId || tenant?.metaPhoneNumberId || null;

    // Se preferir Evolution ou se não tiver credenciais Meta válidas
    const preferredProvider: 'evolution' | 'meta' = (isEvolution || !hasMetaCreds) ? 'evolution' : 'meta';

    // Determina o nome exato da instância no Evolution API com garantia estrita
    let evolutionInstanceName = (instance?.settings as any)?.instanceName;
    if (!evolutionInstanceName || !evolutionInstanceName.startsWith('versus_')) {
      if (instance?.name && instance.name.startsWith('versus_')) {
        evolutionInstanceName = instance.name.replace(' (WhatsApp Web)', '').trim();
      } else {
        const shortTenant = tenantId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
        const shortInst = instance?.id ? instance.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) : 'inst';
        evolutionInstanceName = `versus_${shortTenant}_${shortInst}`;
      }
    }
    const evolutionApiKey = instance?.token || evolutionGlobalKey;

    return {
      instance,
      preferredProvider,
      isLidTarget,
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

  /**
   * Dispara mensagem de texto via Evolution API (Baileys) ou Meta Cloud API com fallback
   */
  async sendText(payload: SendMessagePayload): Promise<SendResult> {
    const cleanPhone = this.sanitizePhone(payload.phone);
    if (!cleanPhone) {
      this.logger.error(`Número de telefone inválido para envio de texto no tenant ${payload.tenantId}`);
      return { success: false, error: 'Telefone inválido' };
    }

    const conn = await this.resolveConnection(payload.tenantId, payload.instanceId, cleanPhone);

    // TENTATIVA 1: Provedor preferencial
    if (conn.preferredProvider === 'evolution') {
      const evoRes = await this.sendEvolutionText(conn.evolution, cleanPhone, payload.content);
      if (evoRes.success) return evoRes;

      // Fallback para Meta SOMENTE se não for LID e tiver credenciais Meta válidas
      if (!conn.isLidTarget && conn.meta.token && conn.meta.phoneNumberId) {
        this.logger.warn(`Evolution API falhou para ${cleanPhone}, acionando fallback Meta API...`);
        const metaRes = await this.sendMetaText(conn.meta, cleanPhone, payload.content);
        if (metaRes.success) return metaRes;
      }
      return evoRes;
    } else {
      const metaRes = await this.sendMetaText(conn.meta, cleanPhone, payload.content);
      if (metaRes.success) return metaRes;

      // Fallback para Evolution API se Meta falhar
      this.logger.warn(`Meta API falhou para ${cleanPhone}, acionando fallback Evolution API...`);
      const evoRes = await this.sendEvolutionText(conn.evolution, cleanPhone, payload.content);
      if (evoRes.success) return evoRes;
      return metaRes;
    }
  }

  /**
   * Envio de texto via Evolution API
   */
  private async sendEvolutionText(
    evoConfig: { url: string; apiKey: string; instanceName: string },
    cleanPhone: string,
    content: string,
  ): Promise<SendResult> {
    try {
      const url = `${evoConfig.url}/message/sendText/${evoConfig.instanceName}`;
      this.logger.log(`Disparando mensagem Evolution API [${evoConfig.instanceName}] para ${cleanPhone}...`);

      const response = await axios.post(
        url,
        {
          number: cleanPhone,
          options: {
            delay: 1200,
            presence: 'composing',
            linkPreview: false,
          },
          textMessage: {
            text: content,
          },
        },
        {
          headers: {
            apikey: evoConfig.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );

      const messageId = response.data?.key?.id || response.data?.id || `evo_${Date.now()}`;
      this.logger.log(`Mensagem enviada com sucesso via Evolution API para ${cleanPhone}. ID: ${messageId}`);
      return {
        success: true,
        messageId,
        provider: 'evolution',
        raw: response.data,
      };
    } catch (err: any) {
      const rawError = err.response?.data?.response?.message || err.response?.data?.message || err.message;
      const errorMsg = typeof rawError === 'object' ? JSON.stringify(rawError) : String(rawError);
      this.logger.error(`Erro no envio Evolution API para ${cleanPhone}: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Envio de texto via Meta Cloud API Oficial
   */
  private async sendMetaText(
    metaConfig: { token: string | null; phoneNumberId: string | null },
    cleanPhone: string,
    content: string,
  ): Promise<SendResult> {
    if (!metaConfig.token || !metaConfig.phoneNumberId) {
      return { success: false, error: 'Credenciais Meta ausentes' };
    }

    try {
      const url = `https://graph.facebook.com/v19.0/${metaConfig.phoneNumberId}/messages`;
      this.logger.log(`Disparando mensagem Meta API para ${cleanPhone}...`);

      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: content,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${metaConfig.token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );

      const messageId = response.data?.messages?.[0]?.id || `meta_${Date.now()}`;
      this.logger.log(`Mensagem enviada com sucesso via Meta API para ${cleanPhone}. ID: ${messageId}`);
      return {
        success: true,
        messageId,
        provider: 'meta',
        raw: response.data,
      };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || err.message;
      this.logger.error(`Erro no envio Meta API para ${cleanPhone}: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Dispara mensagens de mídia (imagens, documentos/PDFs) com suporte a Evolution e Meta
   */
  async sendMedia(payload: SendMediaPayload): Promise<SendResult> {
    const cleanPhone = this.sanitizePhone(payload.phone);
    if (!cleanPhone) {
      return { success: false, error: 'Telefone inválido' };
    }

    const conn = await this.resolveConnection(payload.tenantId, payload.instanceId, cleanPhone);

    // Converte URL local/relativa em URL absoluta
    let fullMediaUrl = payload.mediaUrl;
    if (fullMediaUrl.startsWith('/api-backend') || fullMediaUrl.startsWith('/')) {
      const serverHost = process.env.PUBLIC_BACKEND_URL || 'http://187.127.10.166:3001';
      fullMediaUrl = `${serverHost}${fullMediaUrl.replace('/api-backend', '')}`;
    }

    if (conn.preferredProvider === 'evolution') {
      const evoRes = await this.sendEvolutionMedia(conn.evolution, cleanPhone, payload, fullMediaUrl);
      if (evoRes.success) return evoRes;

      if (!conn.isLidTarget && conn.meta.token && conn.meta.phoneNumberId) {
        return this.sendMetaMedia(conn.meta, cleanPhone, payload, fullMediaUrl);
      }
      return evoRes;
    } else {
      const metaRes = await this.sendMetaMedia(conn.meta, cleanPhone, payload, fullMediaUrl);
      if (metaRes.success) return metaRes;

      return this.sendEvolutionMedia(conn.evolution, cleanPhone, payload, fullMediaUrl);
    }
  }

  private async sendEvolutionMedia(
    evoConfig: { url: string; apiKey: string; instanceName: string },
    cleanPhone: string,
    payload: SendMediaPayload,
    fullMediaUrl: string,
  ): Promise<SendResult> {
    try {
      const url = `${evoConfig.url}/message/sendMedia/${evoConfig.instanceName}`;
      const isDocument = payload.type === 'document';
      const fileName = payload.filename || (isDocument ? 'documento.pdf' : 'imagem.jpg');

      const response = await axios.post(
        url,
        {
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
        },
        {
          headers: {
            apikey: evoConfig.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        },
      );

      const messageId = response.data?.key?.id || response.data?.id || `evo_media_${Date.now()}`;
      this.logger.log(`Mídia [${payload.type}] enviada via Evolution API para ${cleanPhone}. ID: ${messageId}`);
      return { success: true, messageId, provider: 'evolution', raw: response.data };
    } catch (err: any) {
      const rawError = err.response?.data?.response?.message || err.response?.data?.message || err.message;
      const errorMsg = typeof rawError === 'object' ? JSON.stringify(rawError) : String(rawError);
      this.logger.error(`Erro ao enviar mídia Evolution API: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }

  private async sendMetaMedia(
    metaConfig: { token: string | null; phoneNumberId: string | null },
    cleanPhone: string,
    payload: SendMediaPayload,
    fullMediaUrl: string,
  ): Promise<SendResult> {
    if (!metaConfig.token || !metaConfig.phoneNumberId) {
      return { success: false, error: 'Credenciais Meta ausentes' };
    }

    try {
      const url = `https://graph.facebook.com/v19.0/${metaConfig.phoneNumberId}/messages`;
      const isDocument = payload.type === 'document';

      const mediaPayload: any = isDocument
        ? {
            link: fullMediaUrl,
            ...(payload.content ? { caption: payload.content } : {}),
            filename: payload.filename || 'documento.pdf',
          }
        : {
            link: fullMediaUrl,
            ...(payload.content ? { caption: payload.content } : {}),
          };

      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: isDocument ? 'document' : 'image',
          [isDocument ? 'document' : 'image']: mediaPayload,
        },
        {
          headers: {
            Authorization: `Bearer ${metaConfig.token}`,
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        },
      );

      const messageId = response.data?.messages?.[0]?.id || `meta_media_${Date.now()}`;
      this.logger.log(`Mídia [${payload.type}] enviada via Meta API para ${cleanPhone}. ID: ${messageId}`);
      return { success: true, messageId, provider: 'meta', raw: response.data };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || err.message;
      this.logger.error(`Erro ao enviar mídia Meta API: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Dispara mensagens de áudio (PTT/Voz) com suporte a Evolution e Meta
   */
  async sendAudio(payload: SendAudioPayload): Promise<SendResult> {
    const cleanPhone = this.sanitizePhone(payload.phone);
    if (!cleanPhone) {
      return { success: false, error: 'Telefone inválido' };
    }

    const conn = await this.resolveConnection(payload.tenantId, payload.instanceId, cleanPhone);

    let fullAudioUrl = payload.audioUrl;
    if (fullAudioUrl && (fullAudioUrl.startsWith('/api-backend') || fullAudioUrl.startsWith('/'))) {
      const serverHost = process.env.PUBLIC_BACKEND_URL || 'http://187.127.10.166:3001';
      fullAudioUrl = `${serverHost}${fullAudioUrl.replace('/api-backend', '')}`;
    }

    if (conn.preferredProvider === 'evolution') {
      const evoRes = await this.sendEvolutionAudio(conn.evolution, cleanPhone, payload, fullAudioUrl);
      if (evoRes.success) return evoRes;

      if (!conn.isLidTarget && conn.meta.token && conn.meta.phoneNumberId) {
        return this.sendMetaAudio(conn.meta, cleanPhone, payload);
      }
      return evoRes;
    } else {
      const metaRes = await this.sendMetaAudio(conn.meta, cleanPhone, payload);
      if (metaRes.success) return metaRes;

      return this.sendEvolutionAudio(conn.evolution, cleanPhone, payload, fullAudioUrl);
    }
  }

  private async sendEvolutionAudio(
    evoConfig: { url: string; apiKey: string; instanceName: string },
    cleanPhone: string,
    payload: SendAudioPayload,
    fullAudioUrl?: string,
  ): Promise<SendResult> {
    try {
      const url = `${evoConfig.url}/message/sendWhatsAppAudio/${evoConfig.instanceName}`;
      const audioData = payload.audioBuffer
        ? payload.audioBuffer.toString('base64')
        : fullAudioUrl;

      if (!audioData) {
        return { success: false, error: 'Buffer ou URL de áudio ausente' };
      }

      const response = await axios.post(
        url,
        {
          number: cleanPhone,
          options: {
            delay: 1200,
            presence: 'recording',
            encoding: true,
          },
          audioMessage: {
            audio: audioData,
          },
        },
        {
          headers: {
            apikey: evoConfig.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        },
      );

      const messageId = response.data?.key?.id || response.data?.id || `evo_audio_${Date.now()}`;
      this.logger.log(`Áudio enviado com sucesso via Evolution API para ${cleanPhone}. ID: ${messageId}`);
      return { success: true, messageId, provider: 'evolution', raw: response.data };
    } catch (err: any) {
      const rawError = err.response?.data?.response?.message || err.response?.data?.message || err.message;
      const errorMsg = typeof rawError === 'object' ? JSON.stringify(rawError) : String(rawError);
      this.logger.error(`Erro ao enviar áudio Evolution API: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }

  private async sendMetaAudio(
    metaConfig: { token: string | null; phoneNumberId: string | null },
    cleanPhone: string,
    payload: SendAudioPayload,
  ): Promise<SendResult> {
    if (!metaConfig.token || !metaConfig.phoneNumberId) {
      return { success: false, error: 'Credenciais Meta ausentes' };
    }

    try {
      let mediaId: string | null = null;
      if (payload.audioBuffer) {
        try {
          const form = new FormData();
          form.append('messaging_product', 'whatsapp');
          const mimeType = payload.mimeType || 'audio/ogg';
          form.append('type', mimeType);
          const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'm4a' : 'ogg';
          const blob = new Blob([new Uint8Array(payload.audioBuffer)], { type: mimeType });
          form.append('file', blob, `voice_message.${ext}`);

          const uploadRes = await axios.post(
            `https://graph.facebook.com/v19.0/${metaConfig.phoneNumberId}/media`,
            form,
            {
              headers: { Authorization: `Bearer ${metaConfig.token}` },
              timeout: 15000,
            },
          );
          if (uploadRes.data?.id) {
            mediaId = uploadRes.data.id;
          }
        } catch (mediaErr: any) {
          this.logger.warn(`Upload áudio Meta Media API falhou: ${mediaErr.message}`);
        }
      }

      const url = `https://graph.facebook.com/v19.0/${metaConfig.phoneNumberId}/messages`;
      const audioBody: any = mediaId ? { id: mediaId } : { link: payload.audioUrl };

      const response = await axios.post(
        url,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'audio',
          audio: audioBody,
        },
        {
          headers: {
            Authorization: `Bearer ${metaConfig.token}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );

      const messageId = response.data?.messages?.[0]?.id || `meta_audio_${Date.now()}`;
      this.logger.log(`Áudio enviado com sucesso via Meta API para ${cleanPhone}. ID: ${messageId}`);
      return { success: true, messageId, provider: 'meta', raw: response.data };
    } catch (err: any) {
      const errorMsg = err.response?.data?.error?.message || err.message;
      this.logger.error(`Erro ao enviar áudio Meta API: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }
}
