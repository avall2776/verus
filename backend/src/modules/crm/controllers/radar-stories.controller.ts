import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { RadarStoriesService } from '../services/radar-stories.service';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { PlanGuard } from '../../../shared/guards/plan.guard';
import { RequireModule } from '../../../shared/decorators/require-module.decorator';
import { CurrentTenant } from '../../../shared/decorators/tenant.decorator';

@Controller('crm/radar-stories')
@UseGuards(JwtAuthGuard, PlanGuard)
@RequireModule('crm')
export class RadarStoriesController {
  constructor(private readonly radarStoriesService: RadarStoriesService) {}

  @Get('metrics')
  async getMetrics(@CurrentTenant() tenantId: string) {
    return this.radarStoriesService.getMetrics(tenantId);
  }

  @Get('active-posts')
  async getActivePosts(@CurrentTenant() tenantId: string) {
    return this.radarStoriesService.getActivePosts(tenantId);
  }

  @Post('sync')
  async syncStories(@CurrentTenant() tenantId: string) {
    return this.radarStoriesService.syncActiveStories(tenantId);
  }

  @Get('recent-viewers-phones')
  async getRecentViewersPhones(@CurrentTenant() tenantId: string) {
    return this.radarStoriesService.getRecentViewersPhones(tenantId);
  }

  @Get('contact-latest-view')
  async getContactLatestView(
    @CurrentTenant() tenantId: string,
    @Query('phone') phone: string,
    @Query('contactId') contactId?: string,
  ) {
    return this.radarStoriesService.getContactLatestView(tenantId, phone, contactId);
  }

  @Post('publish')
  async publishStory(
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      title: string;
      category: string;
      imageBase64: string;
      scheduledAt?: string;
    },
  ) {
    return this.radarStoriesService.publishStory(tenantId, body);
  }

  @Get('viewers')
  async getViewers(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.radarStoriesService.getViewers(tenantId, { status, category, search });
  }

  @Post('record-view')
  async recordStatusView(
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      phone: string;
      contactName?: string;
      contactId?: string;
      statusMessageId?: string;
      storyTitle?: string;
      category?: string;
      mediaUrl?: string;
      viewedAt?: string;
    }
  ) {
    return this.radarStoriesService.recordStatusView(tenantId, body);
  }

  @Post('approach')
  async generateApproach(
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      contactId: string;
      producerName: string;
      companyOrFarm?: string;
      city?: string;
      state?: string;
      crmStatus: string;
      lastPurchaseInfo?: string;
      statusTitle: string;
      statusCategory: string;
      viewsCountWeek?: number;
    }
  ) {
    return this.radarStoriesService.generateApproach(tenantId, body);
  }
}
