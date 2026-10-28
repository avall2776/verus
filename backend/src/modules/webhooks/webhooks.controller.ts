import { Controller, Get, Post, Body, Param, Query, Res, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Response } from 'express';
import { PrismaService } from '../../shared/database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  // Token de verificação da Meta Developers
  private readonly META_VERIFY_TOKEN = 'versus_secreto_123';

  constructor(
    @InjectQueue('webhook-ingress') private readonly ingressQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
    private readonly whatsappService: WhatsappService,
  ) {}

  // -------------------------------------------------------------
  // 1. META CLOUD API (GET - Validação & POST - Eventos / Status)
  // -------------------------------------------------------------

  @Get('meta')
  verifyMetaWebhookRoot(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response
  ) {
    if (mode === 'subscribe' && token === this.META_VERIFY_TOKEN) {
      this.logger.log('Webhook Meta (Root) verificado com sucesso!');
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }

  @Post('meta')
  @HttpCode(HttpStatus.OK)
  async handleMetaWebhookRoot(@Body() payload: any) {
    return this.handleMetaWebhook('auto', payload);
  }

  @Get('meta/:tenantId')
  verifyMetaWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response
  ) {
    if (mode === 'subscribe' && token === this.META_VERIFY_TOKEN) {
      this.logger.log('Webhook Meta verificado com sucesso!');
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }

  @Post('meta/:tenantId')
  @HttpCode(HttpStatus.OK)
  async handleMetaWebhook(
    @Param('tenantId') tenantId: string,
    @Body() payload: any,
  ) {
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const phoneNumberId = value?.metadata?.phone_number_id ? String(value.metadata.phone_number_id).trim() : null;

    // Identifica todos os tenants ativos vinculados a este número oficial da Meta
    const targetTenantsSet = new Set<string>();

    if (phoneNumberId) {
      const matchingTenants = await this.prisma.tenant.findMany({
        where: {
          OR: [
            { metaPhoneNumberId: phoneNumberId },
            { whatsappInstances: { some: { phoneNumberId } } },
          ],
          isActive: true,
        },
        select: { id: true, name: true },
      });

      for (const mt of matchingTenants) {
        targetTenantsSet.add(mt.id);
      }
    }

    if (tenantId && tenantId !== 'auto') {
      const metaTenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { id: true, isActive: true },
      });
      if (metaTenant && metaTenant.isActive) {
        targetTenantsSet.add(tenantId);
      }
    }

    const targetTenants = Array.from(targetTenantsSet);

    if (targetTenants.length === 0) {
      this.logger.warn(`Webhook Meta ignorado: Nenhum tenant ativo associado ao Phone ID [${phoneNumberId}] ou Tenant [${tenantId}].`);
      return { status: 'no_active_tenants' };
    }

    this.logger.log(`Recebendo POST Meta (Phone ID: ${phoneNumberId || 'N/A'}). Roteando para ${targetTenants.length} tenant(s): [${targetTenants.join(', ')}]`);

    // 1. Processamento de Status de Entrega / Leitura da Meta
    const statuses = value?.statuses;
    if (statuses && Array.isArray(statuses) && statuses.length > 0) {
      for (const st of statuses) {
        const externalId = st.id;
        const rawStatus = st.status; // 'sent' | 'delivered' | 'read' | 'failed'
        let mappedStatus: string = rawStatus;

        if (st.errors && st.errors.length > 0) {
          mappedStatus = 'failed';
          this.logger.error(`Erro retornado pela Meta para a mensagem ${externalId}: ${JSON.stringify(st.errors)}`);
        }

        for (const tId of targetTenants) {
          try {
            const msg = await this.prisma.message.findFirst({
              where: {
                tenantId: tId,
                providerMessageId: externalId,
              },
            });

            if (msg) {
              const statusWeight: Record<string, number> = {
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

                this.chatGateway.emitMessageStatusUpdated(tId, {
                  messageId: msg.id,
                  providerMessageId: externalId,
                  status: mappedStatus,
                  conversationId: msg.conversationId,
                });

                this.logger.log(`Status Meta atualizado no tenant [${tId}]: msg [${msg.id}] -> ${mappedStatus}`);
              }
            }
          } catch (statusErr: any) {
            this.logger.error(`Erro ao atualizar status Meta da mensagem ${externalId} no tenant [${tId}]: ${statusErr.message}`);
          }
        }
      }

      return { status: 'statuses_processed' };
    }

    // 2. Mensagem Inbound do Cliente
    const message = value?.messages?.[0];
    if (!message) {
      return { status: 'ignored', reason: 'Not a message or status event' };
    }

    // Despacho assíncrono para fila (Redis) para todos os tenants vinculados a esta linha
    for (const tId of targetTenants) {
      await this.ingressQueue.add(
        'process-meta-message',
        {
          tenantId: tId,
          webhookData: payload,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          jobId: `msg_${tId}_${message.id}`,
        }
      );
      this.logger.log(`Mensagem Meta [${message.id}] enfileirada para tenant [${tId}].`);
    }

    return { status: 'queued', tenantsTargeted: targetTenants.length };
  }

  // -------------------------------------------------------------
  // 2. EVOLUTION API / BAILEYS (POST - Eventos / Status / Mensagens)
  // -------------------------------------------------------------

  @Post('evolution')
  @HttpCode(HttpStatus.OK)
  async handleEvolutionWebhookDefault(@Body() payload: any) {
    const instanceName = payload.instance || payload.data?.instance;
    let tenantId: string | null = null;

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

  @Post('evolution/:tenantId')
  @HttpCode(HttpStatus.OK)
  async handleEvolutionWebhook(
    @Param('tenantId') tenantId: string,
    @Body() payload: any,
  ) {
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

    // Trava de Segurança: Verifica se o Tenant está ativo antes de processar
    const evoTenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, isActive: true },
    });

    if (!evoTenant || evoTenant.isActive === false) {
      this.logger.warn(`Webhook Evolution ignorado: Empresa [${evoTenant?.name || tenantId}] está BLOQUEADA/INATIVA.`);
      return { status: 'tenant_inactive_ignored' };
    }

    // Processamento automático de Status/Stories do WhatsApp (Radar de Stories)
    await this.handleWhatsAppStatusEvent(tenantId, event, payload);

    // 0. Atualizações de Conexão e Handshake do WhatsApp (CONNECTION_UPDATE)
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
        const set = (inst.settings as any) || {};
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

          // Sincroniza em segundo plano todo o catálogo de contatos e agenda da Evolution API
          this.whatsappService.syncContactsFromEvolution(tenantId, instanceName).catch(err => {
            this.logger.warn(`[Auto-Sync] Erro ao sincronizar contatos da Evolution: ${err.message}`);
          });
        } else if (state === 'close') {
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
        } else if (state === 'connecting') {
          this.chatGateway.emitWhatsAppStatusUpdated(tenantId, {
            ...matchedInstance,
            status: 'connecting',
          });
        }
      }

      return { status: 'connection_update_processed', state };
    }

    // 0.1 Rotação Dinâmica de QR Code pelo Baileys (QRCODE_UPDATED)
    if (event === 'qrcode.updated' || event === 'QRCODE_UPDATED') {
      const instanceName = payload.instance || payload.data?.instance;
      const qrcodeObj = payload.data?.qrcode || payload.data;
      const qrCode = qrcodeObj?.base64 || qrcodeObj?.code || payload.base64 || payload.code;

      if (qrCode) {
        const instances = await this.prisma.whatsAppInstance.findMany({
          where: { tenantId }
        });

        const matchedInstance = instances.find(inst => {
          const set = (inst.settings as any) || {};
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

    // 1. Atualizações de Status de Mensagem (MESSAGES_UPDATE ou SEND_MESSAGE)
    if (event === 'messages.update' || event === 'MESSAGES_UPDATE') {
      const updates = Array.isArray(payload.data) ? payload.data : [payload.data];

      for (const item of updates) {
        const keyId = item?.key?.id || item?.id;
        const rawStatus = item?.update?.status || item?.status;

        if (!keyId || !rawStatus) continue;

        let mappedStatus = 'sent';
        const s = String(rawStatus).toUpperCase();
        if (s.includes('READ') || s.includes('PLAYED')) {
          mappedStatus = 'read';
        } else if (s.includes('DELIVERY') || s.includes('DELIVERED')) {
          mappedStatus = 'delivered';
        } else if (s.includes('SERVER') || s.includes('SENT') || s.includes('RECEIPT')) {
          mappedStatus = 'sent';
        } else if (s.includes('ERROR') || s.includes('FAIL')) {
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
            const statusWeight: Record<string, number> = {
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
        } catch (err: any) {
          this.logger.error(`Erro ao atualizar status Evolution da mensagem ${keyId}: ${err.message}`);
        }
      }

      return { status: 'evolution_status_processed' };
    }

    // 2. Confirmação de Envio (SEND_MESSAGE)
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
        } catch (e) {}
      }
      return { status: 'evolution_send_processed' };
    }

    // 3. Novas Mensagens Inbound (MESSAGES_UPSERT)
    if (event === 'messages.upsert' || event === 'MESSAGES_UPSERT') {
      const data = payload.data;
      const messageObj = data?.message;
      const key = data?.key;
      if (!key) {
        return { status: 'ignored_no_key' };
      }

      if (key.remoteJid === 'status@broadcast' || key.remoteJid?.includes('status@broadcast')) {
        return { status: 'status_broadcast_processed' };
      }

      const isFromMe = Boolean(key.fromMe);

      // Normaliza payload para formato Meta compatível com o WebhookProcessor
      const remoteJid = (key.remoteJid || '').replace('@s.whatsapp.net', '');
      const rawInstName = payload.instance || payload.data?.instance;
      const instName = rawInstName ? rawInstName.replace(' (WhatsApp Web)', '').trim() : '';
      
      // Resolução inteligente e ativa do número de telefone real (evita exibir e salvar @lid)
      let realPhone: string | null = null;

      // Se a mensagem foi enviada pelo operador (fromMe: true), o pushName recebido no webhook é do OPERADOR!
      // Extrai título de anúncio (CTWA / externalAdReply) se houver
      const adTitle = 
        messageObj?.extendedTextMessage?.contextInfo?.externalAdReply?.title ||
        data?.contextInfo?.externalAdReply?.title ||
        messageObj?.contextInfo?.externalAdReply?.title;

      let candidateName = adTitle || (!isFromMe ? (data.pushName || data.verifiedBizName || data.verifiedName) : (data.verifiedBizName || data.verifiedName || null));
      let profilePicUrl = data.profilePictureUrl || null;

      // Se for mensagem enviada pelo operador (fromMe), consulta ativamente o perfil público/comercial do destinatário
      if (isFromMe) {
        try {
          const profile = await this.whatsappService.fetchProfileFromEvolution(instName, key.remoteJid || remoteJid, tenantId);
          if (profile) {
            if (profile.picture && !profilePicUrl) profilePicUrl = profile.picture;
            if (!candidateName && profile.name) {
              candidateName = profile.name;
            }
          }
        } catch (e) {}
      }

      if (remoteJid.includes('@lid') || remoteJid.replace(/\D/g, '').length > 13) {
        const candidatePn = 
          key.participantPn || 
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

        // Se ainda não encontrou telefone real, busca síncronamente na agenda da Evolution API
        if (!realPhone) {
          const resolved = await this.whatsappService.resolveContactFromEvolution(
            tenantId,
            instName,
            key.remoteJid || remoteJid,
            candidateName,
            profilePicUrl
          );
          if (resolved.realPhone) {
            realPhone = resolved.realPhone;
          }
          if (resolved.realName) candidateName = resolved.realName;
          if (resolved.avatarUrl && !profilePicUrl) profilePicUrl = resolved.avatarUrl;
        }
      } else {
        const cleanDigits = remoteJid.replace(/\D/g, '');
        if (cleanDigits.length >= 10 && cleanDigits.length <= 13) {
          realPhone = cleanDigits;
        }
      }

      const textBody =
        messageObj?.conversation ||
        messageObj?.extendedTextMessage?.text ||
        '';

      const contactDisplayName = candidateName && !candidateName.includes('@lid')
        ? candidateName
        : (realPhone ? realPhone : (remoteJid.includes('@lid') ? 'Cliente WhatsApp' : remoteJid));

      // Detecta tipo de mídia recebida (Áudio, Imagem, Vídeo, Documento/PDF, Localização ou Texto)
      const isAudio =
        !!messageObj?.audioMessage ||
        data?.messageType === 'audioMessage' ||
        !!messageObj?.ptt ||
        !!data?.audioMessage;

      const isImage =
        !!messageObj?.imageMessage ||
        data?.messageType === 'imageMessage' ||
        !!data?.imageMessage;

      const isVideo =
        !!messageObj?.videoMessage ||
        data?.messageType === 'videoMessage' ||
        !!data?.videoMessage;

      const locObj =
        messageObj?.locationMessage ||
        messageObj?.liveLocationMessage ||
        data?.locationMessage;
      const isLocation = !!locObj || data?.messageType === 'locationMessage';

      const docObj =
        messageObj?.documentMessage ||
        messageObj?.documentWithCaptionMessage?.message?.documentMessage ||
        data?.documentMessage;
      const isDocument = !!docObj || data?.messageType === 'documentMessage';

      let mediaType: 'text' | 'audio' | 'image' | 'video' | 'document' | 'location' = 'text';
      let mediaMime = 'application/octet-stream';
      let mediaCaption = '';
      let mediaFilename = '';
      let mediaBase64 = data?.base64 || messageObj?.base64;
      let locationUrl: string | null = null;

      if (isAudio) {
        mediaType = 'audio';
        const audioData = messageObj?.audioMessage || data?.audioMessage || messageObj?.ptt;
        mediaMime = audioData?.mimetype || 'audio/ogg';
        mediaBase64 = mediaBase64 || audioData?.base64;
      } else if (isImage) {
        mediaType = 'image';
        const imgData = messageObj?.imageMessage || data?.imageMessage;
        mediaMime = imgData?.mimetype || 'image/jpeg';
        mediaCaption = imgData?.caption || '';
        mediaBase64 = mediaBase64 || imgData?.base64;
      } else if (isVideo) {
        mediaType = 'video';
        const vidData = messageObj?.videoMessage || data?.videoMessage;
        mediaMime = vidData?.mimetype || 'video/mp4';
        mediaCaption = vidData?.caption || '';
        mediaFilename = vidData?.fileName || 'video.mp4';
        mediaBase64 = mediaBase64 || vidData?.base64;
      } else if (isLocation) {
        mediaType = 'location';
        const lat = locObj?.degreesLatitude || locObj?.latitude;
        const lng = locObj?.degreesLongitude || locObj?.longitude;
        const locName = locObj?.name || '';
        const locAddress = locObj?.address || '';
        if (lat !== undefined && lng !== undefined) {
          locationUrl = `https://maps.google.com/?q=${lat},${lng}`;
          mediaCaption = locName ? `${locName}${locAddress ? ' - ' + locAddress : ''}` : (locAddress || `Localização: ${lat}, ${lng}`);
        }
      } else if (isDocument) {
        mediaType = 'document';
        mediaMime = docObj?.mimetype || 'application/pdf';
        mediaCaption = docObj?.caption || '';
        mediaFilename = docObj?.fileName || docObj?.title || 'documento.pdf';
        mediaBase64 = mediaBase64 || docObj?.base64;
      }

      // Se não veio base64 embutido no payload, busca dinamicamente na Evolution API
      if ((isAudio || isImage || isVideo || isDocument) && !mediaBase64 && instName) {
        mediaBase64 = await this.whatsappService.getBase64FromEvolutionMedia(instName, messageObj, key);
      }

      let savedMediaInfo: { url: string; filePath: string; buffer: Buffer } | null = null;
      if (mediaBase64) {
        savedMediaInfo = await this.whatsappService.saveBase64Media(
          tenantId,
          mediaBase64,
          key.id,
          mediaMime,
          mediaFilename
        );
      }

      const mediaUrl = savedMediaInfo?.url || locationUrl || null;

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
                      video: isVideo ? { link: mediaUrl, id: key.id, caption: mediaCaption, mime_type: mediaMime } : undefined,
                      document: isDocument ? { link: mediaUrl, id: key.id, caption: mediaCaption, filename: mediaFilename, mime_type: mediaMime } : undefined,
                      location: isLocation ? { latitude: locObj?.degreesLatitude || locObj?.latitude, longitude: locObj?.degreesLongitude || locObj?.longitude, name: locObj?.name, address: locObj?.address } : undefined,
                      fromMe: isFromMe,
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      await this.ingressQueue.add(
        'process-meta-message',
        {
          tenantId,
          webhookData: normalizedPayload,
          evolutionMetadata: {
            instanceName: instName,
            pushName: candidateName,
            remoteJid: key.remoteJid,
            realPhone: realPhone,
            profilePictureUrl: profilePicUrl,
            mediaUrl: mediaUrl,
            mediaType: mediaType,
            mediaMime: mediaMime,
            mediaCaption: mediaCaption,
            mediaFilename: mediaFilename,
            localFilePath: savedMediaInfo?.filePath || null,
            fromMe: isFromMe,
          },
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          jobId: `msg_${key.id}`,
        }
      );

      return { status: 'queued' };
    }

    // 4. Sincronização de Contatos do WhatsApp (CONTACTS_UPSERT)
    if (event === 'contacts.upsert' || event === 'CONTACTS_UPSERT') {
      const contactsList = Array.isArray(payload.data) ? payload.data : [payload.data];
      for (const c of contactsList) {
        const id = c?.id || c?.remoteJid || '';
        const phone = id.replace('@s.whatsapp.net', '').replace('@c.us', '').replace(/\D/g, '');
        const pushName = c?.pushName || c?.verifiedName || c?.name;
        const profilePictureUrl = c?.profilePictureUrl || null;

        if (phone && phone.length >= 10 && phone.length <= 13 && pushName && !pushName.includes('@lid')) {
          try {
            // 1. Atualiza por telefone direto ou insere se não existir
            const updateRes = await this.prisma.contact.updateMany({
              where: { tenantId, phone },
              data: {
                name: pushName,
                ...(profilePictureUrl ? { avatarUrl: profilePictureUrl } : {}),
              },
            });

            if (updateRes.count === 0) {
              await this.prisma.contact.create({
                data: {
                  tenantId,
                  phone: String(phone),
                  name: String(pushName),
                  avatarUrl: profilePictureUrl ? String(profilePictureUrl) : null,
                } as any
              }).catch(() => {});
            }

            // 2. Reconcilia contatos que ficaram salvos com identificador @lid
            const normPush = this.whatsappService.normalizeContactName(pushName);
            if (normPush && normPush.length >= 3) {
              const lidCandidates = await this.prisma.contact.findMany({
                where: {
                  tenantId,
                  phone: { contains: 'lid' },
                },
              });
              for (const lc of lidCandidates) {
                const lcNorm = this.whatsappService.normalizeContactName(lc.name);
                if (lcNorm === normPush) {
                  await this.prisma.contact.update({
                    where: { id: lc.id },
                    data: {
                      phone: phone,
                      whatsappLid: lc.phone,
                      name: pushName,
                      ...(profilePictureUrl ? { avatarUrl: profilePictureUrl } : {}),
                    },
                  });
                  this.logger.log(`[CONTACTS_UPSERT] Contato LID [${lc.id}] (${lc.name}) reconciliado com telefone real: ${phone}`);
                }
              }
            }

            const updated = await this.prisma.contact.findFirst({ where: { tenantId, phone } });
            if (updated) {
              this.chatGateway.emitContactUpdated(tenantId, updated);
            }
          } catch (e) {}
        }
      }
      return { status: 'contacts_upsert_processed' };
    }

    return { status: 'ignored_unhandled_event' };
  }

  /**
   * Processamento automático de Status/Stories do WhatsApp via Evolution API / Baileys
   * Reconhece status postados e visualizações com data, hora exata e post rastreado
   */
  private async handleWhatsAppStatusEvent(tenantId: string, event: string, payload: any) {
    try {
      const rawInstName = payload?.instance || payload?.data?.instance || '';
      const instName = await this.whatsappService.getEvolutionInstanceName(tenantId, rawInstName);

      // 1. Story postado pela empresa (messages.upsert, SEND_MESSAGE, MESSAGES_SET com status@broadcast e fromMe/número próprio)
      const isPostEvent =
        event === 'messages.upsert' ||
        event === 'MESSAGES_UPSERT' ||
        event === 'send.message' ||
        event === 'SEND_MESSAGE' ||
        event === 'messages.set' ||
        event === 'MESSAGES_SET';

      if (isPostEvent) {
        let items: any[] = [];
        if (Array.isArray(payload.data)) {
          items = payload.data;
        } else if (payload.data?.messages && Array.isArray(payload.data.messages)) {
          items = payload.data.messages;
        } else if (payload.data) {
          items = [payload.data];
        }

        // Obtém o número da instância ativa para conferir se o post partiu do WhatsApp próprio
        const activeInst = await this.prisma.whatsAppInstance.findFirst({
          where: { tenantId, status: { in: ['open', 'connected'] } },
          orderBy: { isDefault: 'desc' },
        });
        const selfDigits = activeInst?.phoneNumber ? activeInst.phoneNumber.replace(/\D/g, '') : null;
        const selfLid = (activeInst?.settings as any)?.ownerLid
          ? String((activeInst?.settings as any).ownerLid).split(':')[0].replace(/\D/g, '')
          : null;

        for (const data of items) {
          const key = data?.key;
          if (!key) continue;

          const remoteJid = key.remoteJid || data.remoteJid || '';
          if (!remoteJid.includes('status@broadcast')) continue;

          const participant = String(key.participant || data.participant || '').split(':')[0].replace(/\D/g, '');
          const isOwn =
            Boolean(key.fromMe) ||
            (selfDigits && participant && (participant.includes(selfDigits) || selfDigits.includes(participant))) ||
            (selfLid && participant && (participant.includes(selfLid) || selfLid.includes(participant)));

          // Se NÃO for post próprio da empresa, é um status postado por cliente/fornecedor. Ignora.
          if (!isOwn) {
            continue;
          }

          const messageObj = data?.message;
          const caption =
            messageObj?.imageMessage?.caption ||
            messageObj?.videoMessage?.caption ||
            messageObj?.extendedTextMessage?.text ||
            messageObj?.conversation ||
            'Status Corporativo';

          let category = 'Geral';
          const lower = caption.toLowerCase();
          if (
            lower.includes('trator') ||
            lower.includes('plantadeira') ||
            lower.includes('semeadeira') ||
            lower.includes('máquina') ||
            lower.includes('implemento') ||
            lower.includes('pulverizador') ||
            lower.includes('colheitadeira') ||
            lower.includes('grade')
          ) {
            category = 'Maquinários';
          } else if (
            lower.includes('adubo') ||
            lower.includes('semente') ||
            lower.includes('defensivo') ||
            lower.includes('químico') ||
            lower.includes('nutri') ||
            lower.includes('npk') ||
            lower.includes('fertilizante')
          ) {
            category = 'Insumos';
          } else if (
            lower.includes('safra') ||
            lower.includes('cotação') ||
            lower.includes('saca') ||
            lower.includes('soja') ||
            lower.includes('milho') ||
            lower.includes('balcão')
          ) {
            category = 'Cotações';
          } else if (
            lower.includes('peça') ||
            lower.includes('filtro') ||
            lower.includes('manutenção') ||
            lower.includes('serviço') ||
            lower.includes('oficina')
          ) {
            category = 'Peças & Serviços';
          }

          // Extração de mídia em ALTA RESOLUÇÃO (prioriza base64 completo da Evolution API ao invés do jpegThumbnail 32x32)
          let fullBase64: string | null = messageObj?.base64 || data?.base64 || null;
          if (!fullBase64 && instName && (messageObj?.imageMessage || messageObj?.videoMessage)) {
            try {
              fullBase64 = await this.whatsappService.getBase64FromEvolutionMedia(instName, messageObj, key);
            } catch {}
          }

          let highResDataUri: string | null = null;
          if (fullBase64 && typeof fullBase64 === 'string' && fullBase64.length > 500 && !messageObj?.videoMessage) {
            const mime = messageObj?.imageMessage?.mimetype || 'image/jpeg';
            highResDataUri = fullBase64.startsWith('data:') ? fullBase64 : `data:${mime};base64,${fullBase64}`;
          }

          const rawJpeg = messageObj?.imageMessage?.jpegThumbnail || messageObj?.videoMessage?.jpegThumbnail;
          let thumbnailBase64: string | null = null;
          if (rawJpeg) {
            if (Buffer.isBuffer(rawJpeg)) {
              thumbnailBase64 = `data:image/jpeg;base64,${rawJpeg.toString('base64')}`;
            } else if (typeof rawJpeg === 'string' && rawJpeg.length > 20) {
              thumbnailBase64 = rawJpeg.startsWith('data:') ? rawJpeg : `data:image/jpeg;base64,${rawJpeg}`;
            } else if (rawJpeg?.data && Array.isArray(rawJpeg.data)) {
              thumbnailBase64 = `data:image/jpeg;base64,${Buffer.from(rawJpeg.data).toString('base64')}`;
            }
          }

          let mediaUrl: string | null = null;
          if (highResDataUri) {
            mediaUrl = highResDataUri;
          } else if (
            data?.mediaUrl &&
            !data.mediaUrl.includes('mmg.whatsapp.net') &&
            !data.mediaUrl.includes('172.16.0.1')
          ) {
            mediaUrl = data.mediaUrl;
          } else if (thumbnailBase64) {
            mediaUrl = thumbnailBase64;
          }

          const tsVal = data?.messageTimestamp?.low || data?.messageTimestamp;
          const postedDate = tsVal ? new Date(Number(tsVal) * 1000) : new Date();

          // Verifica se o post já foi cadastrado pelo messageId ou se foi recém-publicado pelo painel com ID sintético
          let existing = await this.prisma.$queryRawUnsafe<any[]>(
            `SELECT id, "messageId", "mediaUrl" FROM "whatsapp_status_posts" WHERE "tenantId" = $1 AND "messageId" = $2 LIMIT 1`,
            tenantId,
            key.id
          );

          if (!existing || existing.length === 0) {
            existing = await this.prisma.$queryRawUnsafe<any[]>(
              `SELECT id, "messageId", "mediaUrl" FROM "whatsapp_status_posts"
               WHERE "tenantId" = $1
                 AND "messageId" LIKE 'story_msg_%'
                 AND "postedAt" >= NOW() - INTERVAL '15 minutes'
               ORDER BY "postedAt" DESC
               LIMIT 1`,
              tenantId
            );
          }

          let finalPostId = existing?.[0]?.id;
          if (existing && existing.length > 0) {
            const curMediaLen = existing[0].mediaUrl ? String(existing[0].mediaUrl).length : 0;
            const newMediaLen = mediaUrl ? mediaUrl.length : 0;
            const bestMedia = newMediaLen > curMediaLen ? mediaUrl : existing[0].mediaUrl;
            await this.prisma.$executeRawUnsafe(
              `UPDATE "whatsapp_status_posts" SET "messageId" = $1, "mediaUrl" = $2 WHERE "id" = $3`,
              key.id,
              bestMedia,
              existing[0].id
            );
          } else {
            finalPostId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            await this.prisma.$executeRawUnsafe(
              `INSERT INTO "whatsapp_status_posts" ("id", "tenantId", "messageId", "title", "category", "mediaUrl", "postedAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              finalPostId,
              tenantId,
              key.id,
              caption.slice(0, 150),
              category,
              mediaUrl,
              postedDate
            );
            this.logger.log(`[Radar Stories] Novo Story postado detectado no WhatsApp: [${key.id}] "${caption}" (${category})`);
          }

          this.chatGateway.emitStoryPosted(tenantId, {
            messageId: key.id,
            title: caption,
            category,
            mediaUrl,
          });
        }
      }

      // 2. Visualização de Story por um contato (messages.update, receipt.update, status.receipt)
      const isStatusReceipt =
        event === 'receipt.update' ||
        event === 'RECEIPT_UPDATE' ||
        event === 'status.receipt' ||
        event === 'messages.update' ||
        event === 'MESSAGES_UPDATE';

      if (isStatusReceipt) {
        let items: any[] = [];
        if (Array.isArray(payload.data)) {
          items = payload.data;
        } else if (payload.data?.messages && Array.isArray(payload.data.messages)) {
          items = payload.data.messages;
        } else if (payload.data) {
          items = [payload.data];
        }

        for (const item of items) {
          const remoteJid = item?.key?.remoteJid || item?.remoteJid || payload?.data?.key?.remoteJid || '';
          const storyMessageId = item?.key?.id || item?.id || item?.keyId || payload?.data?.key?.id;
          if (!storyMessageId) continue;

          // Verifica se o storyMessageId pertence a um post ativo da empresa (mesmo se o evento vier sem status@broadcast explícito no update)
          let matchedPost: any = null;
          try {
            const posts = await this.prisma.$queryRawUnsafe<any[]>(
              `SELECT * FROM "whatsapp_status_posts" WHERE "tenantId" = $1 AND "messageId" = $2 LIMIT 1`,
              tenantId,
              storyMessageId
            );
            if (posts && posts.length > 0) {
              matchedPost = posts[0];
            }
          } catch (e) {}

          if (!matchedPost && !remoteJid.includes('status@broadcast')) {
            continue;
          }

          // Fallback: se é status@broadcast da própria empresa (fromMe=true) e ainda não estava vinculado
          if (!matchedPost && remoteJid.includes('status@broadcast') && (item?.key?.fromMe || item?.fromMe)) {
            const recentPosts = await this.prisma.$queryRawUnsafe<any[]>(
              `SELECT * FROM "whatsapp_status_posts"
               WHERE "tenantId" = $1 AND "postedAt" >= NOW() - INTERVAL '24 hours'
               ORDER BY "postedAt" DESC LIMIT 1`,
              tenantId
            ).catch(() => []);

            if (recentPosts && recentPosts.length > 0) {
              matchedPost = recentPosts[0];
              if (String(matchedPost.messageId).startsWith('story_msg_')) {
                await this.prisma.$executeRawUnsafe(
                  `UPDATE "whatsapp_status_posts" SET "messageId" = $1 WHERE "id" = $2`,
                  storyMessageId,
                  matchedPost.id
                ).catch(() => {});
                matchedPost.messageId = storyMessageId;
              }
            } else {
              const autoPostId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
              await this.prisma.$executeRawUnsafe(
                `INSERT INTO "whatsapp_status_posts" ("id", "tenantId", "messageId", "title", "category", "postedAt")
                 VALUES ($1, $2, $3, $4, $5, NOW())`,
                autoPostId,
                tenantId,
                storyMessageId,
                'Status Comercial WhatsApp',
                'Maquinários'
              ).catch(() => {});
              matchedPost = {
                id: autoPostId,
                tenantId,
                messageId: storyMessageId,
                title: 'Status Comercial WhatsApp',
                category: 'Maquinários',
                mediaUrl: null,
              };
            }
          }

          if (!matchedPost) {
            continue;
          }

          const rawParticipant =
            item?.participant ||
            item?.key?.participant ||
            item?.receipt?.userJid ||
            item?.userJid ||
            (remoteJid && !remoteJid.includes('status@broadcast') ? remoteJid : null) ||
            payload?.data?.participant ||
            payload?.data?.receipt?.userJid;

          if (!rawParticipant) continue;

          let cleanPhone = String(rawParticipant)
            .split(':')[0]
            .replace('@s.whatsapp.net', '')
            .replace('@c.us', '')
            .replace('@lid', '')
            .replace(/\D/g, '');

          let resolvedName: string | null = null;
          let resolvedAvatar: string | null = null;

          // Resolução profunda e ativa de LIDs usando o motor completo da Evolution API + Base CRM
          if (rawParticipant.includes('@lid') || cleanPhone.length > 13) {
            try {
              const evoResolution = await this.whatsappService.resolveContactFromEvolution(
                tenantId,
                instName,
                rawParticipant,
                item?.pushName || payload?.data?.pushName
              );
              if (evoResolution?.realPhone) {
                cleanPhone = evoResolution.realPhone;
              }
              if (evoResolution?.realName && evoResolution.realName !== 'Comercial Verto') {
                resolvedName = evoResolution.realName;
              }
              if (evoResolution?.avatarUrl) {
                resolvedAvatar = evoResolution.avatarUrl;
              }

              if (cleanPhone.length > 13) {
                const lidMatch = await this.whatsappService.resolveLidFromAllTenants(rawParticipant);
                if (lidMatch?.realPhone) {
                  cleanPhone = lidMatch.realPhone;
                }
                if (!resolvedName && lidMatch?.realName && lidMatch.realName !== 'Comercial Verto') {
                  resolvedName = lidMatch.realName;
                }
              }
            } catch (e) {}
          }

          if (cleanPhone.length < 8) continue;

          const timestampVal =
            item?.update?.readTimestamp ||
            item?.readTimestamp ||
            item?.timestamp ||
            item?.datetime ||
            payload?.data?.receipt?.readTimestamp ||
            payload?.data?.readTimestamp;

          const tsNum = Number(timestampVal);
          const viewedAt = tsNum
            ? new Date(tsNum > 10000000000 ? tsNum : tsNum * 1000)
            : new Date();

          // Busca ou vincula contato real no CRM do tenant
          let contact = await this.prisma.contact.findFirst({
            where: {
              tenantId,
              OR: [
                { phone: cleanPhone },
                ...(cleanPhone.length >= 10 && cleanPhone.length <= 13
                  ? [{ phone: { endsWith: cleanPhone.slice(-8) } }]
                  : []),
                ...(rawParticipant.includes('@lid')
                  ? [{ whatsappLid: rawParticipant }, { whatsappLid: { contains: cleanPhone } }]
                  : []),
              ],
            },
          });

          if (!contact) {
            const formattedPhone = cleanPhone.length >= 10 && cleanPhone.length <= 13 ? cleanPhone : rawParticipant;
            contact = await this.prisma.contact.create({
              data: {
                tenant: { connect: { id: tenantId } },
                name: resolvedName || `Contato WhatsApp (${cleanPhone.slice(-4)})`,
                phone: formattedPhone,
                whatsappLid: rawParticipant.includes('@lid') ? rawParticipant : null,
                avatarUrl: resolvedAvatar,
                source: 'WhatsApp',
                tags: ['Radar Stories', 'Visualizou Status'],
              },
            });
          } else {
            const contactUpdates: any = {};
            if (rawParticipant.includes('@lid') && !contact.whatsappLid) {
              contactUpdates.whatsappLid = rawParticipant;
            }
            if (cleanPhone.length >= 10 && cleanPhone.length <= 13 && (contact.phone?.includes('@lid') || (contact.phone || '').length > 13)) {
              contactUpdates.phone = cleanPhone;
            }
            if (resolvedName && (!contact.name || contact.name.startsWith('Produtor Rural') || contact.name.startsWith('Contato WhatsApp'))) {
              contactUpdates.name = resolvedName;
            }
            if (Object.keys(contactUpdates).length > 0) {
              contact = await this.prisma.contact
                .update({
                  where: { id: contact.id },
                  data: contactUpdates,
                })
                .catch(() => contact!);
            }
          }

          // Salva visualização sem duplicar no mesmo post
          const existing = await this.prisma.$queryRawUnsafe<any[]>(
            `SELECT id FROM "whatsapp_status_views"
             WHERE "tenantId" = $1 AND ("phone" = $2 OR "phone" = $3 OR "contactId" = $4) AND "statusMessageId" = $5
             LIMIT 1`,
            tenantId,
            cleanPhone,
            rawParticipant,
            contact.id,
            storyMessageId
          );

          if (!existing || existing.length === 0) {
            const viewId = `view_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            await this.prisma.$executeRawUnsafe(
              `INSERT INTO "whatsapp_status_views"
               ("id", "tenantId", "contactId", "phone", "contactName", "city", "state", "statusMessageId", "storyTitle", "category", "mediaUrl", "viewedAt")
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
              viewId,
              tenantId,
              contact.id,
              cleanPhone,
              contact.name,
              contact.address || 'Região Sul',
              'RS',
              storyMessageId,
              matchedPost.title,
              matchedPost.category,
              matchedPost.mediaUrl,
              viewedAt
            );

            this.logger.log(
              `[Radar Stories] Visualização auditada: ${cleanPhone} (${contact.name}) viu "${matchedPost.title}" às ${viewedAt.toISOString()}`
            );

            this.chatGateway.emitStoryViewed(tenantId, {
              viewId,
              contactId: contact.id,
              phone: cleanPhone,
              contactName: contact.name,
              storyTitle: matchedPost.title,
              category: matchedPost.category,
              viewedAt: viewedAt.toISOString(),
            });
          }
        }
        return true;
      }
    } catch (err: any) {
      this.logger.error(`[Radar Stories] Falha ao processar evento de status: ${err.message}`, err.stack);
    }
    return false;
  }
}
