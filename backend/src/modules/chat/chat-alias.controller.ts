import { Controller, Post, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatAliasController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sync')
  async syncOfflineMessagesPost(
    @CurrentTenant() tenantId: string,
    @Query('force') force?: string,
  ) {
    return this.chatService.syncOfflineMessages(tenantId, force === 'true' || force === '1');
  }

  @Get('sync')
  async syncOfflineMessagesGet(
    @CurrentTenant() tenantId: string,
    @Query('force') force?: string,
  ) {
    return this.chatService.syncOfflineMessages(tenantId, force === 'true' || force === '1');
  }

  @Post('messages/:messageId/transcribe')
  async transcribeAudioMessage(
    @CurrentTenant() tenantId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.chatService.transcribeAudioMessage(tenantId, messageId);
  }
}
