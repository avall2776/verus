import { Controller, Get, Post, Delete, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { TeamChatService } from './team-chat.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PlanGuard } from '../../shared/guards/plan.guard';
import { RequireModule } from '../../shared/decorators/require-module.decorator';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@Controller('team-chat')
@UseGuards(JwtAuthGuard, PlanGuard)
@RequireModule('teamChat')
export class TeamChatController {
  constructor(private readonly teamChatService: TeamChatService) {}

  @Get('users')
  async getUsers(@CurrentTenant() tenantId: string, @Request() req: any) {
    return this.teamChatService.getUsers(tenantId, req?.user?.id);
  }

  @Get('departments')
  async getDepartments(@CurrentTenant() tenantId: string) {
    return this.teamChatService.getDepartments(tenantId);
  }

  @Get('channels')
  async getChannels(@CurrentTenant() tenantId: string) {
    return this.teamChatService.getChannels(tenantId);
  }

  @Post('channels')
  async createChannel(
    @CurrentTenant() tenantId: string, 
    @Body() body: { name: string; description?: string; isPrivate?: boolean }
  ) {
    return this.teamChatService.createChannel(tenantId, body);
  }

  @Delete('channels/:id')
  async deleteChannel(
    @CurrentTenant() tenantId: string,
    @Param('id') channelId: string,
    @Request() req: any,
  ) {
    return this.teamChatService.deleteChannel(tenantId, req?.user?.id, req?.user?.role, channelId);
  }

  @Get('messages')
  async getMessages(
    @CurrentTenant() tenantId: string,
    @Query('channelId') channelId?: string,
    @Query('receiverId') receiverId?: string,
    @Request() req?: any,
  ) {
    return this.teamChatService.getMessages(tenantId, req.user.id, channelId, receiverId);
  }

  @Post('messages')
  async sendMessage(
    @CurrentTenant() tenantId: string,
    @Request() req: any,
    @Body() body: { channelId?: string; receiverId?: string; content: string; mediaUrl?: string }
  ) {
    return this.teamChatService.sendMessage(tenantId, req.user.id, body);
  }

  @Delete('messages/:id')
  async deleteMessage(
    @CurrentTenant() tenantId: string,
    @Param('id') messageId: string,
    @Request() req: any,
  ) {
    return this.teamChatService.deleteMessage(tenantId, req?.user?.id, req?.user?.role, messageId);
  }

  @Delete('history')
  async clearHistory(
    @CurrentTenant() tenantId: string,
    @Query('channelId') channelId: string,
    @Query('receiverId') receiverId: string,
    @Request() req: any,
  ) {
    return this.teamChatService.clearHistory(tenantId, req?.user?.id, req?.user?.role, {
      channelId,
      receiverId,
    });
  }
}
