import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@Controller('deals')
@UseGuards(JwtAuthGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get()
  async listDeals(@CurrentTenant() tenantId: string) {
    return this.crmService.findAllDeals(tenantId);
  }

  @Patch(':id')
  async updateDeal(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateData: { status?: string; value?: number; assignedTo?: string }
  ) {
    return this.crmService.updateDeal(tenantId, id, updateData);
  }
}
