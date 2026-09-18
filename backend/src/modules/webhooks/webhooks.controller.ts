import { Controller, Get, Post, Body, Param, Query, Res, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Response } from 'express';
import { PrismaService } from '../../shared/database/prisma.service';
import { ChatGateway } from '../chat/chat.gateway';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  // Token de verificação da Meta Developers
  private readonly META_VERIFY_TOKEN = 'versus_secreto_123';

  constructor(
    @InjectQueue('webhook-ingress') private readonly ingressQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly chatGateway: ChatGateway,
  ) {}

  // -------------------------------------------------------------
  // 1. META CLOUD API (GET - Validação & POST - Eventos / Status)
  // -------------------------------------------------------------

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
    this.logger.log(`Recebendo POST da Meta para o tenant: ${tenantId}`);

    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

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

        try {
          const msg = await this.prisma.message.findFirst({
            where: {
              tenantId,
              providerMessageId: externalId,
            },
          });

          if (msg) {
            // Evita retroceder status (ex: não passar de read para delivered)
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
                providerMessageId: externalId,
                status: mappedStatus,
                conversationId: msg.conversationId,
              });

              this.logger.log(`Status Meta atualizado: msg [${msg.id}] -> ${mappedStatus}`);
            }
          }
        } catch (statusErr: any) {
          this.logger.error(`Erro ao atualizar status Meta da mensagem ${externalId}: ${statusErr.message}`);
        }
      }

      return { status: 'statuses_processed' };
    }

    // 2. Mensagem Inbound do Cliente
    const message = value?.messages?.[0];
    if (!message) {
      return { status: 'ignored', reason: 'Not a message or status event' };
    }

    // Despacho assíncrono para fila (Redis)
    await this.ingressQueue.add(
      'process-meta-message',
      {
        tenantId,
        webhookData: payload,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        jobId: `msg_${message.id}`,
      }
    );

    return { status: 'queued' };
  }

  // -------------------------------------------------------------
  // 2. EVOLUTION API / BAILEYS (POST - Eventos / Status / Mensagens)
  // -------------------------------------------------------------

  @Post('evolution')
  @HttpCode(HttpStatus.OK)
  async handleEvolutionWebhookDefault(@Body() payload: any) {
    // Rota global padrão caso o webhook não tenha tenantId na URL
    const defaultTenant = await this.prisma.tenant.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    const tenantId = defaultTenant?.id || 'tenant_123';
    return this.handleEvolutionWebhook(tenantId, payload);
  }

  @Post('evolution/:tenantId')
  @HttpCode(HttpStatus.OK)
  async handleEvolutionWebhook(
    @Param('tenantId') tenantId: string,
    @Body() payload: any,
  ) {
    const event = payload.event;
    this.logger.log(`Recebendo webhook Evolution API [${event}] para tenant: ${tenantId}`);

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
        } else if (state === 'close') {
          if (statusReason === 401 || statusReason === 403 || statusReason === 408) {
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
                details: `Sessão encerrada pelo WhatsApp (Código: ${statusReason})`
              }
            });

            this.chatGateway.emitWhatsAppStatusUpdated(tenantId, updated);
            this.logger.warn(`🔌 [WhatsApp Desconectado] Instância [${matchedInstance.id}] desconectada.`);
          }
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

      if (!key || key.fromMe) {
        return { status: 'ignored_outbound' };
      }

      // Normaliza payload para formato Meta compatível com o WebhookProcessor
      const remoteJid = (key.remoteJid || '').replace('@s.whatsapp.net', '');
      const textBody =
        messageObj?.conversation ||
        messageObj?.extendedTextMessage?.text ||
        '';

      const normalizedPayload = {
        entry: [
          {
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  contacts: [
                    {
                      profile: { name: data.pushName || remoteJid },
                      wa_id: remoteJid,
                    },
                  ],
                  messages: [
                    {
                      from: remoteJid,
                      id: key.id,
                      timestamp: String(data.messageTimestamp || Math.floor(Date.now() / 1000)),
                      type: messageObj?.imageMessage ? 'image' : messageObj?.audioMessage ? 'audio' : 'text',
                      text: textBody ? { body: textBody } : undefined,
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
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          jobId: `msg_${key.id}`,
        }
      );

      return { status: 'queued' };
    }

    return { status: 'ignored_unhandled_event' };
  }
}
