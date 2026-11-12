import { 
  Controller, Get, Post, Delete, Patch, Param, Body, UseGuards, Request 
} from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Retorna a chave pública VAPID para registro no Google FCM
   */
  @Get('vapid-public-key')
  getVapidPublicKey() {
    return this.notificationsService.getVapidPublicKey();
  }

  /**
   * Salva a assinatura push de um celular ou navegador
   */
  @Post('push-subscription')
  async savePushSubscription(
    @CurrentTenant() tenantId: string,
    @Request() req,
    @Body() body: { endpoint: string; keys: { p256dh: string; auth: string }; userAgent?: string }
  ) {
    const userId = req.user.id || req.user.userId;
    return this.notificationsService.savePushSubscription(tenantId, userId, body);
  }

  /**
   * Remove a assinatura push
   */
  @Delete('push-subscription')
  async removePushSubscription(@Body() body: { endpoint: string }) {
    return this.notificationsService.removePushSubscription(body?.endpoint);
  }

  /**
   * Dispara um teste real de push pelo Google FCM para o dispositivo do operador
   */
  @Post('test-push')
  async testPush(@CurrentTenant() tenantId: string, @Request() req) {
    const userId = req.user.id || req.user.userId;
    await this.notificationsService.sendPushToUser(tenantId, userId, {
      title: 'Novo atendimento na fila · Atendimento',
      body: 'Joao Batista aguarda atendimento na fila do setor Atendimento.',
      url: '/inbox',
      tag: `test_push_${Date.now()}`
    });
    return { success: true, message: 'Push de teste disparado via Google FCM' };
  }

  /**
   * Retorna a lista de notificações e contador de não lidas do tenant / usuário
   */
  @Get()
  async getNotifications(@CurrentTenant() tenantId: string, @Request() req) {
    const userId = req.user.id || req.user.userId;
    return this.notificationsService.getNotifications(tenantId, userId);
  }

  /**
   * Marca todas as notificações como lidas
   */
  @Post('mark-all-read')
  async markAllAsRead(@CurrentTenant() tenantId: string, @Request() req) {
    const userId = req.user.id || req.user.userId;
    return this.notificationsService.markAllAsRead(tenantId, userId);
  }

  /**
   * Marca uma notificação específica como lida
   */
  @Patch(':id/read')
  async markAsRead(@CurrentTenant() tenantId: string, @Request() req, @Param('id') id: string) {
    const userId = req.user.id || req.user.userId;
    return this.notificationsService.markAsRead(tenantId, userId, id);
  }
}

