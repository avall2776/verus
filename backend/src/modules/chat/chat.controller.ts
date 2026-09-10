import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
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
    @Query('status') status?: string,
  ) {
    return this.chatService.findAllConversations(tenantId, status);
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
  ) {
    return this.chatService.takeoverConversation(tenantId, conversationId);
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
    return this.chatService.sendManualMessage(tenantId, conversationId, payload);
  }
}
