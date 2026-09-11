import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@UseGuards(JwtAuthGuard)
@Controller('automations')
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Get()
  async findAll(@CurrentTenant() tenantId: string) {
    return this.automationsService.findAll(tenantId);
  }

  @Get('logs')
  async getLogs(@CurrentTenant() tenantId: string) {
    return this.automationsService.getLogs(tenantId);
  }

  @Post()
  async create(@CurrentTenant() tenantId: string, @Body() body: any) {
    return this.automationsService.create(tenantId, body);
  }

  @Patch(':id')
  async update(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() body: any) {
    return this.automationsService.update(tenantId, id, body);
  }

  @Patch(':id/toggle')
  async toggle(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.automationsService.update(tenantId, id, { isActive: body.isActive });
  }

  @Delete(':id')
  async remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.automationsService.remove(tenantId, id);
  }
}
