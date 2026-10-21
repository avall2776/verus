import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';
import { ApiTokensService } from './api-tokens.service';

@Controller('api/v1/api-tokens')
@UseGuards(JwtAuthGuard)
export class ApiTokensController {
  constructor(private readonly apiTokensService: ApiTokensService) {}

  @Get()
  async listTokens(@CurrentTenant() tenantId: string) {
    return this.apiTokensService.listTokens(tenantId);
  }

  @Post()
  async createToken(
    @CurrentTenant() tenantId: string,
    @Body() body: { name: string; permissions?: any },
    @Req() req: any
  ) {
    const createdBy = req.user?.name || req.user?.email || 'Administrador';
    return this.apiTokensService.createToken(tenantId, body.name, body.permissions, createdBy);
  }

  @Patch(':id/toggle')
  async toggleToken(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string
  ) {
    return this.apiTokensService.toggleToken(tenantId, id);
  }

  @Delete(':id')
  async deleteToken(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string
  ) {
    return this.apiTokensService.deleteToken(tenantId, id);
  }
}
