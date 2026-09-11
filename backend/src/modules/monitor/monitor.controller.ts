import { Controller, Get, UseGuards } from '@nestjs/common';
import { MonitorService } from './monitor.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@Controller('monitor')
@UseGuards(JwtAuthGuard)
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}

  @Get('active')
  async getActiveConversations(@CurrentTenant() tenantId: string) {
    return this.monitorService.getActiveConversations(tenantId);
  }
}
