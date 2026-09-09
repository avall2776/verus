import { Controller, Get, Post, Body, Param, Query, Res, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Response } from 'express';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);
  
  // O token de verificação que configuramos lá no painel da Meta Developers
  private readonly META_VERIFY_TOKEN = 'versus_secreto_123';

  constructor(
    @InjectQueue('webhook-ingress') private readonly ingressQueue: Queue,
  ) {}

  // 1. Verificação de Segurança da Meta (GET)
  // Quando colamos a URL no painel, a Meta faz um GET para ver se o servidor é real.
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

  // 2. Recebimento de Mensagens (POST)
  @Post('meta/:tenantId')
  @HttpCode(HttpStatus.OK)
  async handleMetaWebhook(
    @Param('tenantId') tenantId: string,
    @Body() payload: any, // Formato do Payload Oficial da Meta
  ) {
    this.logger.log(`Recebendo POST da Meta para o tenant: ${tenantId}`);

    // Ignorar eventos que não tenham "messages" (ex: status de leitura)
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message) {
      return { status: 'ignored', reason: 'Not a message event' };
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
        jobId: `msg_${message.id}` 
      }
    );

    // Resposta Imediata para a Meta não dar Timeout
    return { status: 'queued' };
  }
}
