import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';

@Controller('whatsapp')
@UseGuards(JwtAuthGuard)
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('config')
  async getConfig(@CurrentTenant() tenantId: string) {
    return this.whatsappService.getConfig(tenantId);
  }

  @Patch('config')
  async updateConfig(@CurrentTenant() tenantId: string, @Body() body: any) {
    return this.whatsappService.updateConfig(tenantId, body);
  }
}
