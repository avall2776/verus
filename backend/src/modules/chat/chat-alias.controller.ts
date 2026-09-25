import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatAliasController {
  constructor(private readonly chatService: ChatService) {}

  @Post('sync')
  async syncOfflineMessagesPost(@CurrentTenant() tenantId: string) {
    return this.chatService.syncOfflineMessages(tenantId);
  }

  @Get('sync')
  async syncOfflineMessagesGet(@CurrentTenant() tenantId: string) {
    return this.chatService.syncOfflineMessages(tenantId);
  }
}
