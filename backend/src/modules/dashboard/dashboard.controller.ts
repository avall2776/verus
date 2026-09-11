import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('dashboard')
  async getDashboardData(@CurrentTenant() tenantId: string) {
    return this.dashboardService.getDashboardData(tenantId);
  }

  @Get('atendimento')
  async getAtendimentoMetrics(@CurrentTenant() tenantId: string) {
    return this.dashboardService.getAtendimentoMetrics(tenantId);
  }

  @Get('crm')
  async getCrmMetrics(@CurrentTenant() tenantId: string) {
    return this.dashboardService.getCrmMetrics(tenantId);
  }
}
