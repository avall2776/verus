import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { TeamChatService } from './team-chat.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@Controller('team-chat')
@UseGuards(JwtAuthGuard)
export class TeamChatController {
  constructor(private readonly teamChatService: TeamChatService) {}

  @Get('users')
  async getUsers(@CurrentTenant() tenantId: string) {
    return this.teamChatService.getUsers(tenantId);
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
}
