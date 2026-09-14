import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  // -------------------------------------------------------------
  // ROTAS MULTI-TENANT DE INSTÂNCIAS WHATSAPP
  // -------------------------------------------------------------

  @Get('instances')
  async getInstances(@CurrentTenant() tenantId: string) {
    return this.whatsappService.getInstances(tenantId);
  }

  @Post('instances')
  async createInstance(
    @CurrentTenant() tenantId: string,
    @Body() body: any
  ) {
    return this.whatsappService.createInstance(tenantId, body);
  }

  @Get('instances/:id')
  async getInstanceById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string
  ) {
    return this.whatsappService.getInstanceById(tenantId, id);
  }

  @Patch('instances/:id')
  async updateInstance(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: any
  ) {
    return this.whatsappService.updateInstance(tenantId, id, body);
  }

  @Delete('instances/:id')
  async deleteInstance(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string
  ) {
    return this.whatsappService.deleteInstance(tenantId, id);
  }

  @Post('instances/:id/connect')
  async connectInstance(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: { mode?: 'qr' | 'meta' }
  ) {
    return this.whatsappService.connectInstance(tenantId, id, body?.mode || 'meta');
  }

  @Post('instances/:id/disconnect')
  async disconnectInstance(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string
  ) {
    return this.whatsappService.disconnectInstance(tenantId, id);
  }

  // -------------------------------------------------------------
  // ROTAS LEGADAS (RETROCOMPATIBILIDADE)
  // -------------------------------------------------------------

  @Get('config')
  async getConfig(@CurrentTenant() tenantId: string) {
    return this.whatsappService.getConfig(tenantId);
  }

  @Patch('config')
  async updateConfig(
    @CurrentTenant() tenantId: string,
    @Body() body: any
  ) {
    return this.whatsappService.updateConfig(tenantId, body);
  }
}
