import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { QuickRepliesService } from './quick-replies.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('quick-replies')
export class QuickRepliesController {
  constructor(private readonly quickRepliesService: QuickRepliesService) {}

  @Get()
  async getQuickReplies(@Request() req: any) {
    return this.quickRepliesService.findAll(req.user.tenantId);
  }

  @Post()
  async createQuickReply(@Request() req: any, @Body() body: { shortcut: string; content: string }) {
    return this.quickRepliesService.create(req.user.tenantId, body.shortcut, body.content);
  }

  @Patch(':id')
  async updateQuickReply(@Request() req: any, @Param('id') id: string, @Body() body: { shortcut?: string; content?: string }) {
    return this.quickRepliesService.update(req.user.tenantId, id, body);
  }

  @Delete(':id')
  async deleteQuickReply(@Request() req: any, @Param('id') id: string) {
    return this.quickRepliesService.delete(req.user.tenantId, id);
  }
}
