import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { PublicApiKeyGuard } from './guards/public-api-key.guard';
import { PublicApiService } from './public-api.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@Controller(['api/v1/public', 'public-api'])
@UseGuards(PublicApiKeyGuard)
export class PublicApiController {
  constructor(private readonly publicApiService: PublicApiService) {}

  /**
   * Endpoint de Saúde / Verificação de Token
   */
  @Get(['health', 'me', 'verify'])
  async checkHealth(@Req() req: any) {
    return {
      success: true,
      status: 'active',
      tenantId: req.tenantId,
      tenantName: req.tenant?.name,
      tokenName: req.apiToken?.name,
      authenticatedAt: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  /**
   * Endpoint Principal de Ingestão de Leads (Meta Ads / Webhooks / Landing Pages)
   */
  @Post('leads')
  async createLead(@Req() req: any, @Body() body: CreateLeadDto) {
    return this.publicApiService.createLead(req.tenantId, body);
  }

  /**
   * Lista os Funis e Etapas disponíveis no CRM
   */
  @Get('funnels')
  async getFunnels(@Req() req: any) {
    return this.publicApiService.getFunnels(req.tenantId);
  }

  /**
   * Lista os Atendentes da equipe para atribuição de leads
   */
  @Get('users')
  async getUsers(@Req() req: any) {
    return this.publicApiService.getUsers(req.tenantId);
  }

  /**
   * Criação direta de Contato
   */
  @Post('contacts')
  async createContact(@Req() req: any, @Body() body: any) {
    return this.publicApiService.createContact(req.tenantId, body);
  }

  /**
   * Criação direta de Oportunidade / Negociação no CRM
   */
  @Post('deals')
  async createDeal(@Req() req: any, @Body() body: any) {
    return this.publicApiService.createDeal(req.tenantId, body);
  }
}
