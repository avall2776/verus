import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { PlanGuard } from '../../shared/guards/plan.guard';
import { RequireModule } from '../../shared/decorators/require-module.decorator';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@Controller(['deals', 'crm/deals'])
@UseGuards(JwtAuthGuard, PlanGuard)
@RequireModule('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get()
  async listDeals(@CurrentTenant() tenantId: string) {
    return this.crmService.findAllDeals(tenantId);
  }

  @Get('users')
  async listUsers(@CurrentTenant() tenantId: string) {
    return this.crmService.findTenantUsers(tenantId);
  }

  @Post()
  async createDeal(
    @CurrentTenant() tenantId: string,
    @Body() dealData: any
  ) {
    return this.crmService.createDeal(tenantId, dealData);
  }

  @Post('move-contact')
  async moveContact(
    @CurrentTenant() tenantId: string,
    @Body() body: { contactId: string; stageId: string; title?: string; value?: number }
  ) {
    return this.crmService.moveContactToStage(tenantId, body);
  }

  @Get('contact/:contactId')
  async getDealByContact(
    @CurrentTenant() tenantId: string,
    @Param('contactId') contactId: string
  ) {
    return this.crmService.getContactDeal(tenantId, contactId);
  }

  @Get(':id')
  async getDeal(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string
  ) {
    return this.crmService.findOneDeal(tenantId, id);
  }

  @Patch(':id')
  async updateDeal(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateData: { status?: string; value?: number; assignedTo?: string; notes?: string; title?: string; metadata?: any }
  ) {
    return this.crmService.updateDeal(tenantId, id, updateData);
  }
}
