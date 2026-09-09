import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { AgentService } from './agent.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@UseGuards(JwtAuthGuard)
@Controller('agent/config')
export class AgentController {
  constructor(private agentService: AgentService) {}

  @Get()
  async getConfig(@CurrentTenant() tenantId: string) {
    return this.agentService.getConfig(tenantId);
  }

  @Patch()
  async updateConfig(
    @CurrentTenant() tenantId: string,
    @Body() body: any
  ) {
    return this.agentService.updateConfig(tenantId, body);
  }
}
