import { Controller, Get, Param, UseGuards } from '@nestjs/common';
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

  @Get('geo-map')
  async getGeoMapData(@CurrentTenant() tenantId: string) {
    return this.dashboardService.getGeoMapData(tenantId);
  }

  @Get('geo-map/ai-strategy')
  async getStrategicAiReport(@CurrentTenant() tenantId: string) {
    return this.dashboardService.getStrategicAiReport(tenantId);
  }

  @Get('geo-map/deal-audit/:dealId')
  async auditDealWithAi(
    @CurrentTenant() tenantId: string,
    @Param('dealId') dealId: string
  ) {
    return this.dashboardService.auditDealWithAi(tenantId, dealId);
  }
}
