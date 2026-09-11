import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  async getOverview(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getOverview(tenantId, startDate, endDate);
  }

  @Get('charts')
  async getCharts(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getCharts(tenantId, startDate, endDate);
  }

  @Get('agent-performance')
  async getAgentPerformance(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getAgentPerformance(tenantId, startDate, endDate);
  }

  @Get('detailed-tickets')
  async getDetailedTickets(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('agentId') agentId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string
  ) {
    return this.analyticsService.getDetailedTickets(tenantId, {
      startDate,
      endDate,
      agentId,
      departmentId,
      status,
      page,
      limit,
      search,
    });
  }

  @Get('ai-costs')
  async getAiCosts(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getAiCosts(tenantId, startDate, endDate);
  }

  @Get('csat')
  async getCsat(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getCsat(tenantId, startDate, endDate);
  }
}
