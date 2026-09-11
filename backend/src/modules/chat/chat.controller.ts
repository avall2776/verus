import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  async listConversations(
    @CurrentTenant() tenantId: string,
    @Request() req: any,
    @Query('tab') tab?: string,
  ) {
    return this.chatService.findAllConversations(tenantId, req.user.id, req.user.role, tab || 'waiting');
  }

  @Get(':id/messages')
  async getMessages(
    @CurrentTenant() tenantId: string,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.getConversationMessages(tenantId, conversationId);
  }

  @Patch(':id/takeover')
  async takeover(
    @CurrentTenant() tenantId: string,
    @Param('id') conversationId: string,
    @Request() req: any,
  ) {
    return this.chatService.takeoverConversation(tenantId, conversationId, req.user.id);
  }

  @Patch(':id/release')
  async release(
    @CurrentTenant() tenantId: string,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.releaseConversation(tenantId, conversationId);
  }

  @Patch(':id/transfer')
  async transfer(
    @CurrentTenant() tenantId: string,
    @Param('id') conversationId: string,
    @Body() body: { departmentId: string },
  ) {
    return this.chatService.transferToDepartment(tenantId, conversationId, body.departmentId);
  }

  @Patch(':id/assign')
  async assign(
    @CurrentTenant() tenantId: string,
    @Param('id') conversationId: string,
    @Body() body: { userId: string },
  ) {
    return this.chatService.assignToUser(tenantId, conversationId, body.userId);
  }

  @Post(':id/messages')
  async sendMessage(
    @CurrentTenant() tenantId: string,
    @Param('id') conversationId: string,
    @Body() payload: SendMessageDto,
  ) {
    try {
      return await this.chatService.sendManualMessage(tenantId, conversationId, payload);
    } catch (error) {
      console.error('ERRO AO ENVIAR MENSAGEM MANUAL:', error);
      throw error;
    }
  }
}
