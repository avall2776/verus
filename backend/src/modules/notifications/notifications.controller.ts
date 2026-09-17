import { 
  Controller, Get, Post, Patch, Param, UseGuards, Request 
} from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Retorna a lista de notificações e contador de não lidas do tenant / usuário
   */
  @Get()
  async getNotifications(@Request() req) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id || req.user.userId;
    return this.notificationsService.getNotifications(tenantId, userId);
  }

  /**
   * Marca todas as notificações como lidas
   */
  @Post('mark-all-read')
  async markAllAsRead(@Request() req) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id || req.user.userId;
    return this.notificationsService.markAllAsRead(tenantId, userId);
  }

  /**
   * Marca uma notificação específica como lida
   */
  @Patch(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    const userId = req.user.id || req.user.userId;
    return this.notificationsService.markAsRead(tenantId, userId, id);
  }
}
