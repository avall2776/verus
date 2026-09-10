import { Controller, Get, UseGuards, Request } from '@nestjs/common';
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
}
