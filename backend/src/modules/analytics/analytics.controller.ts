import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PlanGuard } from '../../shared/guards/plan.guard';
import { RequireModule } from '../../shared/decorators/require-module.decorator';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, PlanGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @RequireModule('analytics')
  async getOverview(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getOverview(tenantId, startDate, endDate);
  }

  @Get('charts')
  @RequireModule('analytics')
  async getCharts(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getCharts(tenantId, startDate, endDate);
  }

  @Get('agent-performance')
  @RequireModule('analytics')
  async getAgentPerformance(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getAgentPerformance(tenantId, startDate, endDate);
  }

  @Get('detailed-tickets')
  @RequireModule('analytics')
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
  @RequireModule('analytics')
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
    @Query('endDate') endDate?: string,
    @Query('agentName') agentName?: string,
    @Query('search') search?: string,
  ) {
    return this.analyticsService.getCsat(tenantId, startDate, endDate, agentName, search);
  }

  @Post('csat')
  async createCsat(
    @CurrentTenant() tenantId: string,
    @Body() body: any,
  ) {
    return this.analyticsService.createCsatSurvey(tenantId, body);
  }

  @Get('funnel')
  @RequireModule('analytics')
  async getFunnel(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getFunnel(tenantId, startDate, endDate);
  }

  @Get('bottlenecks')
  @RequireModule('analytics')
  async getBottlenecks(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getBottlenecks(tenantId, startDate, endDate);
  }

  @Get('channels')
  @RequireModule('analytics')
  async getChannels(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getChannels(tenantId, startDate, endDate);
  }
}
