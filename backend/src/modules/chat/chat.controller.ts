import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ScheduleMessageDto } from './dto/schedule-message.dto';
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
    @Query('status') status?: string,
  ) {
    const selectedTab = tab || status || 'waiting';
    return this.chatService.findAllConversations(tenantId, req.user.id, req.user.role, selectedTab);
  }

  @Get('counts')
  async getConversationCounts(
    @CurrentTenant() tenantId: string,
    @Request() req: any,
  ) {
    return this.chatService.getConversationCounts(tenantId, req.user.id, req.user.role);
  }

  @Get('operator-productivity')
  async getOperatorProductivity(
    @CurrentTenant() tenantId: string,
    @Request() req: any,
  ) {
    return this.chatService.getOperatorProductivity(tenantId, req.user.id);
  }

  @Get('scheduled/all')
  async getAllScheduledMessages(
    @CurrentTenant() tenantId: string,
  ) {
    return this.chatService.getAllScheduledMessages(tenantId);
  }

  @Post('scheduled/batch-cancel')
  async batchCancelScheduledMessages(
    @CurrentTenant() tenantId: string,
    @Body() body: { messageIds: string[] },
  ) {
    return this.chatService.batchCancelScheduledMessages(tenantId, body.messageIds);
  }

  @Get(':id/messages')
  async getMessages(
    @CurrentTenant() tenantId: string,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.getConversationMessages(tenantId, conversationId);
  }

  @Get('contact/:contactId')
  async getConversationByContact(
    @CurrentTenant() tenantId: string,
    @Param('contactId') contactId: string,
  ) {
    return this.chatService.getConversationByContact(tenantId, contactId);
  }

  @Get(':id')
  async getConversation(
    @CurrentTenant() tenantId: string,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.getConversationById(tenantId, conversationId);
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

  @Patch(':id/resolve')
  async resolve(
    @CurrentTenant() tenantId: string,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.releaseConversation(tenantId, conversationId);
  }

  @Patch(':id/reopen')
  async reopen(
    @CurrentTenant() tenantId: string,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.reopenConversation(tenantId, conversationId);
  }

  @Patch(':id/read')
  async markAsRead(
    @CurrentTenant() tenantId: string,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.markAsRead(tenantId, conversationId);
  }

  @Patch(':id/unread')
  async markAsUnread(
    @CurrentTenant() tenantId: string,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.markAsUnread(tenantId, conversationId);
  }

  @Patch(':id/ignore')
  async ignore(
    @CurrentTenant() tenantId: string,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.releaseConversation(tenantId, conversationId);
  }

  @Patch(':id/transfer')
  async transfer(
    @CurrentTenant() tenantId: string,
    @Request() req: any,
    @Param('id') conversationId: string,
    @Body() body: { departmentId: string; userId?: string },
  ) {
    const operatorName = req.user?.name || req.user?.email || 'Um operador';
    return this.chatService.transferToDepartment(tenantId, conversationId, body.departmentId, body.userId, operatorName);
  }

  @Patch(':id/assign')
  async assign(
    @CurrentTenant() tenantId: string,
    @Request() req: any,
    @Param('id') conversationId: string,
    @Body() body: { userId: string },
  ) {
    const operatorName = req.user?.name || req.user?.email || 'Um operador';
    return this.chatService.assignToUser(tenantId, conversationId, body.userId, operatorName);
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

  @Post(':id/messages/audio')
  @UseInterceptors(FileInterceptor('file'))
  async sendAudioMessage(
    @CurrentTenant() tenantId: string,
    @Param('id') conversationId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('isInternal') isInternal?: string | boolean,
    @Body('content') content?: string,
    @Body('instanceId') instanceId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo de áudio obrigatório.');
    }
    return this.chatService.sendManualAudioMessage(tenantId, conversationId, file, {
      isInternal: isInternal === 'true' || isInternal === true,
      content: content || '🎤 Mensagem de voz',
      instanceId,
    });
  }

  @Post(':id/schedule')
  async scheduleMessage(
    @CurrentTenant() tenantId: string,
    @Param('id') conversationId: string,
    @Body() payload: ScheduleMessageDto,
  ) {
    try {
      return await this.chatService.scheduleMessage(tenantId, conversationId, payload);
    } catch (error) {
      console.error('ERRO AO AGENDAR MENSAGEM:', error);
      throw error;
    }
  }

  @Get(':id/scheduled')
  async getScheduledMessages(
    @CurrentTenant() tenantId: string,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.getScheduledMessages(tenantId, conversationId);
  }

  @Delete('messages/:messageId/schedule')
  async cancelScheduledMessage(
    @CurrentTenant() tenantId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.chatService.cancelScheduledMessage(tenantId, messageId);
  }

  @Post('contact/:contactId/messages')
  async sendMessageToContact(
    @CurrentTenant() tenantId: string,
    @Param('contactId') contactId: string,
    @Body() payload: SendMessageDto,
    @Request() req: any,
  ) {
    try {
      return await this.chatService.sendManualMessageToContact(tenantId, contactId, payload, req.user.id);
    } catch (error) {
      console.error('ERRO AO ENVIAR MENSAGEM DIRETA:', error);
      throw error;
    }
  }
}

