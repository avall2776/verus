import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { QuickRepliesService } from './quick-replies.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@UseGuards(JwtAuthGuard)
@Controller('quick-replies')
export class QuickRepliesController {
  constructor(private readonly quickRepliesService: QuickRepliesService) {}

  @Get()
  async getQuickReplies(@CurrentTenant() tenantId: string) {
    return this.quickRepliesService.findAll(tenantId);
  }

  @Post()
  async createQuickReply(@CurrentTenant() tenantId: string, @Body() body: { shortcut: string; content: string }) {
    return this.quickRepliesService.create(tenantId, body.shortcut, body.content);
  }

  @Patch(':id')
  async updateQuickReply(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() body: { shortcut?: string; content?: string }) {
    return this.quickRepliesService.update(tenantId, id, body);
  }

  @Delete(':id')
  async deleteQuickReply(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.quickRepliesService.delete(tenantId, id);
  }
}
