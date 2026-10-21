import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Req,
} from '@nestjs/common';
import { AgencyMarketingService } from './agency-marketing.service';
import { CreateMarketingCardDto } from './dto/create-marketing-card.dto';
import { UpdateMarketingCardDto } from './dto/update-marketing-card.dto';
import { CreateMarketingClientDto } from './dto/create-marketing-client.dto';
import { UpdateMarketingClientDto } from './dto/update-marketing-client.dto';
import { CreateMarketingCampaignDto } from './dto/create-marketing-campaign.dto';
import { UpdateMarketingCampaignDto } from './dto/update-marketing-campaign.dto';
import { TimeClockDto } from './dto/time-clock.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { TenantGuard } from '../../shared/guards/tenant.guard';
import { MarketingModuleGuard } from '../../shared/guards/marketing-module.guard';
import { CurrentTenant } from '../../shared/decorators/tenant.decorator';
import { PrismaService } from '../../shared/database/prisma.service';
import { GoogleDriveSyncService } from './google-drive-sync.service';

@Controller(['agency/marketing', 'api/agency/marketing'])
@UseGuards(JwtAuthGuard, TenantGuard, MarketingModuleGuard)
export class AgencyMarketingController {
  constructor(
    private readonly marketingService: AgencyMarketingService,
    private readonly driveSyncService: GoogleDriveSyncService,
    private readonly prisma: PrismaService,
  ) {}

  // =========================================================================
  // KANBAN DE PRODUÇÃO OPERACIONAL (CARDS)
  // =========================================================================

  @Get('cards')
  async getCards(
    @CurrentTenant() tenantId: string,
    @Query('clientId') clientId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.marketingService.getCards(tenantId, { clientId, status, search });
  }

  @Post('cards')
  async createCard(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateMarketingCardDto,
  ) {
    return this.marketingService.createCard(tenantId, dto);
  }

  @Patch('cards/reorder')
  async reorderCards(
    @CurrentTenant() tenantId: string,
    @Body() body: { items: Array<{ id: string; status: string; position: number }> },
  ) {
    return this.marketingService.reorderCards(tenantId, body.items || []);
  }

  @Patch('cards/:id')
  async updateCard(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMarketingCardDto,
  ) {
    return this.marketingService.updateCard(tenantId, id, dto);
  }

  @Delete('cards/:id')
  async deleteCard(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.marketingService.deleteCard(tenantId, id);
  }

  // =========================================================================
  // GESTÃO DE CLIENTES & ESCOPOS DE MARKETING
  // =========================================================================

  @Get('clients')
  async getClients(@CurrentTenant() tenantId: string) {
    return this.marketingService.getClients(tenantId);
  }

  @Post('clients')
  async createClient(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateMarketingClientDto,
  ) {
    return this.marketingService.createClient(tenantId, dto);
  }

  @Patch('clients/:id')
  async updateClient(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMarketingClientDto,
  ) {
    return this.marketingService.updateClient(tenantId, id, dto);
  }

  @Delete('clients/:id')
  async deleteClient(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.marketingService.deleteClient(tenantId, id);
  }

  @Get('clients/:id')
  async getClientById(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.marketingService.getClientPieces(tenantId, id);
  }

  @Get('clients/:id/pieces')
  async getClientPieces(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.marketingService.getClientPieces(tenantId, id);
  }

  // =========================================================================
  // ABA TRÁFEGO PAGO (CAMPANHAS, BUDGET, CPL, ROAS, LEADS)
  // =========================================================================

  @Get('campaigns')
  async getCampaigns(
    @CurrentTenant() tenantId: string,
    @Query('clientId') clientId?: string,
    @Query('platform') platform?: string,
    @Query('status') status?: string,
  ) {
    return this.marketingService.getCampaigns(tenantId, { clientId, platform, status });
  }

  @Get('campaigns/summary')
  async getTrafficSummary(@CurrentTenant() tenantId: string) {
    return this.marketingService.getTrafficSummary(tenantId);
  }

  @Post('campaigns')
  async createCampaign(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateMarketingCampaignDto,
  ) {
    return this.marketingService.createCampaign(tenantId, dto);
  }

  @Patch('campaigns/:id')
  async updateCampaign(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMarketingCampaignDto,
  ) {
    return this.marketingService.updateCampaign(tenantId, id, dto);
  }

  @Delete('campaigns/:id')
  async deleteCampaign(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.marketingService.deleteCampaign(tenantId, id);
  }

  // =========================================================================
  // CRONOGRAMA & CALENDÁRIO
  // =========================================================================

  @Get('schedule')
  async getSchedule(
    @CurrentTenant() tenantId: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.marketingService.getSchedule(tenantId, start, end, clientId);
  }

  // =========================================================================
  // PONTO ELETRÔNICO & MONITORAMENTO POR SESSÃO
  // =========================================================================

  @Post('time-clock')
  async logTime(
    @CurrentTenant() tenantId: string,
    @Request() req,
    @Body() dto: TimeClockDto,
  ) {
    const userId = req.user?.id || req.user?.userId;
    const ipAddress =
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Browser Client';

    return this.marketingService.logTime(
      tenantId,
      userId,
      dto,
      String(ipAddress),
      String(userAgent)
    );
  }

  @Get('time-clock/today')
  async getTodayTimeStatus(
    @CurrentTenant() tenantId: string,
    @Request() req,
  ) {
    const userId = req.user?.id || req.user?.userId;
    return this.marketingService.getTodayTimeStatus(tenantId, userId);
  }

  @Get('time-clock/history')
  async getTimeHistory(
    @CurrentTenant() tenantId: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.marketingService.getTimeHistory(
      tenantId,
      userId,
      limit ? parseInt(limit, 10) : 50
    );
  }

  // =========================================================================
  // EQUIPE DA EMPRESA (MEMBROS DISPONÍVEIS PARA ATRIBUIÇÃO)
  // =========================================================================

  @Get('team')
  async getTeamMembers(@CurrentTenant() tenantId: string) {
    return this.prisma.user.findMany({
      where: {
        tenantId,
        isActive: true,
        isSuperAdmin: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        canAccessMarketing: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  // =========================================================================
  // SINCRONIZAÇÃO E MONITORAMENTO AUTOMÁTICO DO GOOGLE DRIVE (5 TB)
  // =========================================================================

  @Get('drive/config')
  async getDriveConfig(@CurrentTenant() tenantId: string) {
    return this.driveSyncService.getSyncConfig(tenantId);
  }

  @Post('drive/config')
  async saveDriveConfig(
    @CurrentTenant() tenantId: string,
    @Body() body: { rootFolderUrl?: string; apiKey?: string; autoSync?: boolean },
  ) {
    return this.driveSyncService.saveSyncConfig(tenantId, body);
  }

  @Post('drive/sync')
  async syncDrive(
    @CurrentTenant() tenantId: string,
    @Body()
    body: {
      rootFolderUrl?: string;
      apiKey?: string;
      autoCreateClients?: boolean;
    },
  ) {
    return this.driveSyncService.syncTenantDrive(tenantId, body);
  }
}
